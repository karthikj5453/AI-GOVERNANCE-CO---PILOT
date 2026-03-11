"""
Sentiment Analysis Engine
Layer 3 - AI Intelligence Engine: Section 3.3

Model: cardiffnlp/twitter-xlm-roberta-base-sentiment
- Polarity score (-1 to +1)
- Confidence score (0-1)
- Key phrase extraction
- Trend direction (7-day moving average)
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import deque
import statistics
import logging

logger = logging.getLogger(__name__)


# ─── Schemas ────────────────────────────────────────────────────────────────────
from pydantic import BaseModel

class SentimentInput(BaseModel):
    text     : str
    source   : str = "citizen"     # citizen | social_media | news | field_report
    booth_id : Optional[str] = None
    timestamp: Optional[str] = None

class SentimentResult(BaseModel):
    text            : str
    polarity        : float          # -1.0 (negative) → +1.0 (positive)
    polarity_label  : str            # Positive / Neutral / Negative
    confidence      : float          # 0.0 → 1.0
    key_phrases     : List[str]
    trend_direction : str            # improving | declining | stable
    analyzed_at     : str


# ─── Sentiment Engine ───────────────────────────────────────────────────────────
class SentimentEngine:
    """
    Uses cardiffnlp/twitter-xlm-roberta-base-sentiment via HuggingFace.
    Falls back to keyword-based scoring if model unavailable (hackathon mode).
    """

    def __init__(self, use_transformer: bool = False):
        self.use_transformer = use_transformer
        self._history: Dict[str, deque] = {}   # booth_id → rolling scores
        self._pipe = None

        if use_transformer:
            self._load_transformer()

    def _load_transformer(self):
        try:
            from transformers import pipeline as hf_pipeline
            self._pipe = hf_pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
                top_k=None
            )
            logger.info("Transformer sentiment model loaded.")
        except Exception as e:
            logger.warning(f"Could not load transformer: {e}. Falling back to keyword mode.")
            self.use_transformer = False

    # ── Public API ───────────────────────────────────────────────────────────────
    def analyze(self, item: SentimentInput) -> SentimentResult:
        if self.use_transformer and self._pipe:
            polarity, confidence, label = self._transformer_score(item.text)
        else:
            polarity, confidence, label = self._keyword_score(item.text)

        key_phrases = self._extract_key_phrases(item.text)
        trend       = self._compute_trend(item.booth_id, polarity)

        return SentimentResult(
            text           =item.text,
            polarity       =round(polarity, 3),
            polarity_label =label,
            confidence     =round(confidence, 3),
            key_phrases    =key_phrases,
            trend_direction=trend,
            analyzed_at    =datetime.utcnow().isoformat()
        )

    def analyze_batch(self, items: List[SentimentInput]) -> List[SentimentResult]:
        return [self.analyze(item) for item in items]

    def get_booth_trend(self, booth_id: str) -> Dict:
        """Return 7-day moving average sentiment for a booth."""
        history = list(self._history.get(booth_id, []))
        if not history:
            return {"booth_id": booth_id, "average_polarity": None, "data_points": 0}

        avg = round(statistics.mean(history), 3)
        direction = self._direction_label(history)
        return {
            "booth_id"        : booth_id,
            "average_polarity": avg,
            "data_points"     : len(history),
            "trend_direction" : direction,
        }

    # ── Scoring Methods ──────────────────────────────────────────────────────────
    def _transformer_score(self, text: str):
        results = self._pipe(text[:512])[0]           # cap at 512 tokens
        label_map = {"positive": 1.0, "negative": -1.0, "neutral": 0.0}
        best = max(results, key=lambda x: x["score"])
        label    = best["label"].lower()
        polarity = label_map.get(label, 0.0) * best["score"]
        return polarity, best["score"], label.title()

    def _keyword_score(self, text: str):
        """Lightweight keyword fallback — no dependencies."""
        positive_words = ["good", "great", "excellent", "improved", "satisfied", "resolved",
                          "helpful", "clean", "happy", "working", "fast", "efficient"]
        negative_words = ["bad", "worst", "broken", "corrupt", "delay", "no supply",
                          "irregular", "dirty", "failed", "poor", "useless", "ignored",
                          "weeks", "months", "unresolved", "dangerous", "emergency"]

        text_lower = text.lower()
        pos = sum(1 for w in positive_words if w in text_lower)
        neg = sum(1 for w in negative_words if w in text_lower)
        total = pos + neg or 1

        polarity   = (pos - neg) / total
        confidence = min(0.5 + abs(polarity) * 0.4, 0.95)

        if polarity > 0.1 : label = "Positive"
        elif polarity < -0.1: label = "Negative"
        else:                 label = "Neutral"

        return polarity, confidence, label

    # ── Trend Computation ────────────────────────────────────────────────────────
    def _compute_trend(self, booth_id: Optional[str], polarity: float) -> str:
        if not booth_id:
            return "stable"

        if booth_id not in self._history:
            self._history[booth_id] = deque(maxlen=7)   # 7-day window
        self._history[booth_id].append(polarity)

        return self._direction_label(list(self._history[booth_id]))

    def _direction_label(self, series: List[float]) -> str:
        if len(series) < 2:
            return "stable"
        diff = series[-1] - series[0]
        if diff > 0.1 : return "improving"
        if diff < -0.1: return "declining"
        return "stable"

    # ── Key Phrase Extraction ────────────────────────────────────────────────────
    def _extract_key_phrases(self, text: str) -> List[str]:
        """Simple noun-phrase heuristic. Replace with spaCy NER for production."""
        governance_terms = [
            "water supply", "road repair", "electricity", "garbage", "hospital",
            "scheme", "ration", "pension", "police", "corruption", "sanitation",
            "drainage", "pm kisan", "ward", "booth"
        ]
        text_lower = text.lower()
        return [term for term in governance_terms if term in text_lower][:5]


# ─── FastAPI Routes ──────────────────────────────────────────────────────────────
from fastapi import APIRouter

router = APIRouter(prefix="/api/sentiment", tags=["Sentiment"])
engine = SentimentEngine(use_transformer=False)   # set True when GPU available

@router.post("/analyze", response_model=SentimentResult)
async def analyze_sentiment(item: SentimentInput):
    return engine.analyze(item)

@router.post("/analyze-batch", response_model=List[SentimentResult])
async def analyze_batch(items: List[SentimentInput]):
    return engine.analyze_batch(items)

@router.get("/booth/{booth_id}/trend")
async def booth_trend(booth_id: str):
    return engine.get_booth_trend(booth_id)