"""
Shared LangChain/LangGraph agent factory and SSE streaming helpers.
"""
import json
import os
from typing import AsyncGenerator, Any, Callable
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langchain_core.tools import BaseTool
from langchain_core.callbacks.base import AsyncCallbackHandler
from langgraph.prebuilt import create_react_agent


def make_sse(event: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(event)}\n\n"


class StreamingCallbackHandler(AsyncCallbackHandler):
    """Collect streaming events into a queue."""

    def __init__(self, queue):
        self.queue = queue

    async def on_llm_new_token(self, token: str, **kwargs):
        await self.queue.put({"type": "token", "content": token})

    async def on_tool_start(self, serialized: dict, input_str: str, run_id=None,
                            parent_run_id=None, tags=None, metadata=None,
                            inputs=None, **kwargs):
        name = serialized.get("name", "tool") if isinstance(serialized, dict) else "tool"
        snippet = str(input_str)[:200] if input_str else ""
        await self.queue.put({"type": "tool_start", "tool": name, "input": snippet})

    async def on_tool_end(self, output: Any, **kwargs):
        snippet = str(output)[:500] if output else ""
        await self.queue.put({"type": "tool_end", "output": snippet})

    async def on_llm_error(self, error: Exception, **kwargs):
        await self.queue.put({"type": "error", "content": str(error)})

    async def on_chain_error(self, error: Exception, **kwargs):
        await self.queue.put({"type": "error", "content": str(error)})


def create_llm(temperature: float = 0.3, callbacks=None):
    return ChatAnthropic(
        model="claude-3-5-haiku-20241022",
        temperature=temperature,
        streaming=True,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        callbacks=callbacks or [],
    )


async def run_agent_stream(
    tools: list[BaseTool],
    system_prompt: str,
    user_input: str,
    send: Callable,
    temperature: float = 0.3,
) -> str:
    """Run a LangGraph ReAct agent and stream events via `send`."""
    import asyncio

    queue: asyncio.Queue = asyncio.Queue()
    handler = StreamingCallbackHandler(queue)
    llm = create_llm(temperature, callbacks=[handler])

    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=system_prompt,
    )

    final_output = ""

    async def consume_queue():
        while True:
            try:
                event = queue.get_nowait()
                await send(event)
            except Exception:
                break

    stream = agent.astream(
        {"messages": [HumanMessage(content=user_input)]},
        stream_mode="values",
    )

    async for chunk in stream:
        await consume_queue()
        messages = chunk.get("messages", [])
        for msg in messages:
            if hasattr(msg, "type") and msg.type == "ai" and isinstance(msg.content, str) and msg.content.strip():
                final_output = msg.content
            elif msg.__class__.__name__ == "AIMessage" and isinstance(msg.content, str) and msg.content.strip():
                final_output = msg.content

    await consume_queue()
    return final_output


async def stream_chain(prompt_template, llm, variables: dict, send: Callable):
    """Stream a simple LangChain prompt|LLM|StrOutputParser chain."""
    from langchain_core.output_parsers import StrOutputParser
    chain = prompt_template | llm | StrOutputParser()
    async for chunk in chain.astream(variables):
        await send({"type": "token", "content": chunk})


async def sse_generator(handler_coro) -> AsyncGenerator[str, None]:
    """
    Wrap an async handler coroutine that receives a `send` callback,
    yield SSE lines.
    """
    import asyncio

    queue: asyncio.Queue = asyncio.Queue()

    async def send(event: dict):
        await queue.put(event)

    async def run():
        try:
            await handler_coro(send)
            await queue.put({"type": "final", "content": "done"})
        except Exception as e:
            await queue.put({"type": "error", "content": str(e)})
        finally:
            await queue.put(None)  # sentinel

    task = asyncio.create_task(run())

    while True:
        item = await queue.get()
        if item is None:
            break
        yield make_sse(item)

    await task
