"""
AI Governance Co-Pilot — FastAPI Main Application
Wires all AI modules into a single running backend.

Start with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# ── Module routers ──────────────────────────────────────────────────────────────
from rag.rag_pipeline               import router as rag_router,       init_pipeline
from complaint_intelligence.classifier import router as complaint_router
from sentiment.sentiment_engine     import router as sentiment_router
from document_summarizer.summarizer import router as summarizer_router, init_summarizer
from speech_generator.speech_generator import router as speech_router,  init_speech_generator
from predictive.alert_engine        import router as alert_router
from health_score.health_score      import router as health_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ─────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title      ="AI Governance Co-Pilot",
    description="AI-powered intelligence OS for political leaders — Team Phoenix",
    version    ="1.0.0",
    docs_url   ="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins    =["http://localhost:3000"],   # Next.js frontend
    allow_credentials=True,
    allow_methods    =["*"],
    allow_headers    =["*"],
)

# ── Register AI routers ─────────────────────────────────────────────────────────
app.include_router(rag_router)
app.include_router(complaint_router)
app.include_router(sentiment_router)
app.include_router(summarizer_router)
app.include_router(speech_router)
app.include_router(alert_router)
app.include_router(health_router)


# ── Startup: initialise LLM once ────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """
    Choose ONE LLM option and uncomment it.
    All AI modules share the same LLM instance.
    """
    llm = None

    # ── Option A: OpenAI (recommended for hackathon speed) ──────────────────────
    # from langchain_openai import ChatOpenAI
    # import os
    # llm = ChatOpenAI(model="gpt-4o-mini", api_key=os.environ["OPENAI_API_KEY"])

    # ── Option B: Local Ollama (Llama 3.1 8B, free, no internet) ───────────────
    # from langchain_community.llms import Ollama
    # llm = Ollama(model="llama3.1")

    # ── Option C: HuggingFace local pipeline (GPU required) ────────────────────
    # from transformers import pipeline as hf_pipeline
    # from langchain_community.llms import HuggingFacePipeline
    # pipe = hf_pipeline("text-generation", model="meta-llama/Llama-3.1-8B-Instruct",
    #                    max_new_tokens=512, device=0)
    # llm = HuggingFacePipeline(pipeline=pipe)

    if llm:
        init_pipeline(llm)             # RAG
        init_summarizer(llm)           # Document Summarizer
        init_speech_generator(llm)     # Speech Generator
        logger.info("LLM initialised and injected into all AI modules.")
    else:
        logger.warning("No LLM configured — modules will use mock/keyword fallbacks.")


# ── Health check ─────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "project": "AI Governance Co-Pilot",
        "team"   : "Team Phoenix",
        "status" : "running",
        "modules": [
            "RAG Pipeline              → POST /api/rag/query",
            "Complaint Intelligence    → POST /api/complaints/ingest",
            "Sentiment Analysis        → POST /api/sentiment/analyze",
            "Document Summarizer       → POST /api/files/summarize",
            "Speech Generator          → POST /api/speech/generate",
            "Predictive Alerts         → POST /api/alerts/detect",
            "Constituency Health Score → POST /api/health/constituency/{id}",
        ]
    }