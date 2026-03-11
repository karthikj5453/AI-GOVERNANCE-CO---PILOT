"""
RAG (Retrieval Augmented Generation) Pipeline
Layer 3 - AI Intelligence Engine: Section 3.1

Uses FAISS for vector search + LangChain + LLM to answer questions
grounded in uploaded government documents.
"""

import os
from typing import List, Dict
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.llms import HuggingFacePipeline
from langchain.prompts import PromptTemplate
import logging

logger = logging.getLogger(__name__)


# ─── Config ────────────────────────────────────────────────────────────────────
CHUNK_SIZE    = 500
CHUNK_OVERLAP = 50
TOP_K_DOCS    = 5
EMBED_MODEL   = "sentence-transformers/all-MiniLM-L6-v2"
FAISS_INDEX_PATH = "faiss_index"

RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are an AI assistant for a Government Governance Co-Pilot system.
Answer the question based ONLY on the provided context.
If the answer is not in the context, say "Information not found in provided documents."

Context:
{context}

Question: {question}

Answer:"""
)


# ─── Core Pipeline ──────────────────────────────────────────────────────────────
class RAGPipeline:
    def __init__(self, llm=None):
        self.embeddings  = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
        self.vectorstore = None
        self.qa_chain    = None
        self.llm         = llm  # pass your LLM (HuggingFace, OpenAI, etc.)
        self.splitter    = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )

    def ingest_documents(self, texts: List[str], metadatas: List[Dict] = None) -> None:
        """
        Ingest raw text chunks into FAISS vector store.
        Call this after PDF extraction.
        """
        chunks = []
        for i, text in enumerate(texts):
            splits = self.splitter.split_text(text)
            chunks.extend(splits)

        logger.info(f"Ingesting {len(chunks)} chunks into FAISS...")
        self.vectorstore = FAISS.from_texts(chunks, self.embeddings)
        self.vectorstore.save_local(FAISS_INDEX_PATH)
        logger.info("FAISS index saved.")
        self._build_chain()

    def load_existing_index(self) -> None:
        """Load a previously saved FAISS index from disk."""
        self.vectorstore = FAISS.load_local(
            FAISS_INDEX_PATH,
            self.embeddings,
            allow_dangerous_deserialization=True
        )
        self._build_chain()
        logger.info("FAISS index loaded.")

    def _build_chain(self) -> None:
        if self.llm is None:
            raise ValueError("LLM not set. Pass an LLM instance to RAGPipeline.")
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": TOP_K_DOCS})
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=retriever,
            chain_type="stuff",
            chain_type_kwargs={"prompt": RAG_PROMPT},
            return_source_documents=True
        )

    def query(self, question: str) -> Dict:
        """
        Query the RAG pipeline.
        Returns answer + source document references.
        """
        if self.qa_chain is None:
            raise RuntimeError("Pipeline not initialised. Call ingest_documents() or load_existing_index() first.")

        result = self.qa_chain({"query": question})
        sources = [doc.page_content[:200] for doc in result.get("source_documents", [])]

        return {
            "question": question,
            "answer"  : result["result"].strip(),
            "sources" : sources
        }


# ─── FastAPI Route (plug into main app) ────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/rag", tags=["RAG"])

class QueryRequest(BaseModel):
    question: str

# Singleton pipeline — initialised once at startup
_pipeline: RAGPipeline = None

def get_pipeline() -> RAGPipeline:
    global _pipeline
    if _pipeline is None:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialised.")
    return _pipeline

def init_pipeline(llm) -> None:
    """Call this from main.py startup with your chosen LLM."""
    global _pipeline
    _pipeline = RAGPipeline(llm=llm)
    try:
        _pipeline.load_existing_index()
    except Exception:
        logger.warning("No existing FAISS index found. Ingest documents first.")

@router.post("/query")
async def rag_query(request: QueryRequest):
    pipeline = get_pipeline()
    return pipeline.query(request.question)