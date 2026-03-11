# AI Governance Co-Pilot — AI Module

**Team Phoenix** | Hackathon Build

## Folder Structure

```
ai_governance_copilot/
│
├── main.py                          ← FastAPI app entry point (start here)
├── requirements.txt
│
├── rag/
│   └── rag_pipeline.py              ← RAG: FAISS + LangChain + LLM
│
├── complaint_intelligence/
│   └── classifier.py                ← BERT complaint classifier + urgency scorer
│
├── sentiment/
│   └── sentiment_engine.py          ← Sentiment analysis + 7-day trend
│
├── document_summarizer/
│   └── summarizer.py                ← PDF → 5-point AI summary
│
├── speech_generator/
│   └── speech_generator.py          ← Data-injected speech drafts
│
├── predictive/
│   └── alert_engine.py              ← Surge detection + risk alerts
│
├── health_score/
│   └── health_score.py              ← Constituency Health Score (0-100)
│
└── utils/
    └── mock_data_generator.py       ← Faker-based demo data generator
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate mock data (for demo)
python utils/mock_data_generator.py

# 3. Configure LLM in main.py (uncomment ONE option)
#    - Option A: OpenAI  →  set OPENAI_API_KEY env var
#    - Option B: Ollama  →  run `ollama pull llama3.1` first
#    - Option C: HuggingFace local pipeline

# 4. Start the backend
uvicorn main:app --reload --port 8000

# 5. View API docs
open http://localhost:8000/docs
```

## API Endpoints

| Module | Method | Endpoint |
|---|---|---|
| RAG | POST | `/api/rag/query` |
| Complaints | POST | `/api/complaints/ingest` |
| Complaints (batch) | POST | `/api/complaints/batch-ingest` |
| Sentiment | POST | `/api/sentiment/analyze` |
| Sentiment trend | GET | `/api/sentiment/booth/{booth_id}/trend` |
| Document Summarizer | POST | `/api/files/summarize` |
| Speech Generator | POST | `/api/speech/generate` |
| Predictive Alerts | POST | `/api/alerts/detect` |
| Booth Health | POST | `/api/health/booth` |
| Constituency Health | POST | `/api/health/constituency/{id}` |

## No-GPU Hackathon Mode

All modules have keyword/statistical fallbacks — no GPU or API key needed for demo.
Set `use_transformer=False` (default) and leave `llm=None` in `main.py`.

## Wiring to Frontend (Next.js)

Each endpoint is REST + JSON. Example from Next.js:
```js
const res = await fetch("http://localhost:8000/api/complaints/ingest", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ complaint_text: "Water supply broken in Ward 12 for 3 weeks" })
});
const data = await res.json();
// data.category, data.urgency, data.department ...
```