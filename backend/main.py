from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.agent import router as agent_router
from routes.papers import router as papers_router

app = FastAPI(title="AI for Research API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # testing
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(agent_router, prefix="/api/agent")
app.include_router(papers_router, prefix="/api/papers")


@app.get("/health")
async def health():
    return {"status": "ok"}
