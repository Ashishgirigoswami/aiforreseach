"""
Shared LangChain/LangGraph agent factory and SSE streaming helpers.
"""
import json
import os
from typing import AsyncGenerator, Callable
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langchain_core.tools import BaseTool
from langgraph.prebuilt import create_react_agent


def make_sse(event: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(event)}\n\n"



def create_llm(temperature: float = 0.3, callbacks=None):
    return ChatAnthropic(
        model="claude-3-haiku-20240307",
        temperature=temperature,
        streaming=True,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        callbacks=callbacks or [],
    )


def _extract_text(content) -> str:
    """Extract plain text from an AIMessage content (str or list of blocks)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ]
        return "".join(parts)
    return ""


async def run_agent_stream(
    tools: list[BaseTool],
    system_prompt: str,
    user_input: str,
    send: Callable,
    temperature: float = 0.3,
) -> str:
    """Run a LangGraph ReAct agent and stream events via `send`."""
    llm = create_llm(temperature)

    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=system_prompt,
    )

    final_output = ""

    async for event in agent.astream_events(
        {"messages": [HumanMessage(content=user_input)]},
        version="v2",
    ):
        kind = event["event"]

        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            text = _extract_text(chunk.content)
            if text:
                await send({"type": "token", "content": text})

        elif kind == "on_tool_start":
            tool_name = event.get("name", "tool")
            input_data = str(event["data"].get("input", ""))[:200]
            await send({"type": "tool_start", "tool": tool_name, "input": input_data})

        elif kind == "on_tool_end":
            output = str(event["data"].get("output", ""))[:500]
            await send({"type": "tool_end", "output": output})

        elif kind == "on_chain_end" and event.get("name") == "LangGraph":
            messages = event["data"].get("output", {}).get("messages", [])
            for msg in reversed(messages):
                if msg.__class__.__name__ in ("AIMessage", "AIMessageChunk"):
                    text = _extract_text(msg.content)
                    if text.strip():
                        final_output = text
                        break

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
