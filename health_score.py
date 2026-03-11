"""
Constituency Health Score
Feature 6 — Section 3.7

Formula:
  Health Score = (0.40 × Complaint Resolution) + (0.30 × Sentiment Score) + (0.30 × Scheme Coverage)

Color Coding:
  Red   < 40  → Critical
  Amber 40-70 → Monitor
  Green > 70  → Good
"""

from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ─── Schemas ────────────────────────────────────────────────────────────────────
class HealthInput(BaseModel):
    booth_id           : str
    total_complaints   : int
    resolved_complaints: int
    sentiment_score    : float       # 0.0 → 1.0 (engine outputs -1 to 1; normalize before passing)
    total_eligible     : int         # citizens eligible for at least one scheme
    enrolled_citizens  : int         # citizens actually enrolled

class HealthResult(BaseModel):
    booth_id                : str
    health_score            : int          # 0-100
    color                   : str          # Red | Amber | Green
    status_label            : str
    complaint_resolution_pct: float
    sentiment_normalized    : float
    scheme_coverage_pct     : float
    breakdown               : dict
    calculated_at           : str

class ConstituencyHealthResult(BaseModel):
    constituency_id  : str
    overall_score    : int
    color            : str
    booth_scores     : List[HealthResult]
    lowest_booth     : Optional[str]
    highest_booth    : Optional[str]
    calculated_at    : str


# ─── Health Score Calculator ─────────────────────────────────────────────────────
class HealthScoreCalculator:

    WEIGHTS = {
        "complaint_resolution": 0.40,
        "sentiment"           : 0.30,
        "scheme_coverage"     : 0.30,
    }

    def calculate_booth(self, data: HealthInput) -> HealthResult:
        # Component scores (all normalized to 0-100)
        complaint_res = self._safe_pct(data.resolved_complaints, data.total_complaints)
        sentiment     = self._normalize_sentiment(data.sentiment_score)
        scheme_cov    = self._safe_pct(data.enrolled_citizens, data.total_eligible)

        score = int(
            complaint_res * self.WEIGHTS["complaint_resolution"] +
            sentiment     * self.WEIGHTS["sentiment"]            +
            scheme_cov    * self.WEIGHTS["scheme_coverage"]
        )
        score = max(0, min(100, score))

        color, label = self._classify(score)

        return HealthResult(
            booth_id                =data.booth_id,
            health_score            =score,
            color                   =color,
            status_label            =label,
            complaint_resolution_pct=round(complaint_res, 1),
            sentiment_normalized    =round(sentiment, 1),
            scheme_coverage_pct     =round(scheme_cov, 1),
            breakdown={
                "complaint_resolution_weighted": round(complaint_res * self.WEIGHTS["complaint_resolution"], 2),
                "sentiment_weighted"           : round(sentiment     * self.WEIGHTS["sentiment"],            2),
                "scheme_coverage_weighted"     : round(scheme_cov    * self.WEIGHTS["scheme_coverage"],      2),
            },
            calculated_at=datetime.utcnow().isoformat()
        )

    def calculate_constituency(
        self,
        constituency_id: str,
        booth_inputs: List[HealthInput]
    ) -> ConstituencyHealthResult:
        booth_scores = [self.calculate_booth(b) for b in booth_inputs]

        if not booth_scores:
            return ConstituencyHealthResult(
                constituency_id=constituency_id,
                overall_score=0,
                color="Red",
                booth_scores=[],
                lowest_booth=None,
                highest_booth=None,
                calculated_at=datetime.utcnow().isoformat()
            )

        overall = int(sum(b.health_score for b in booth_scores) / len(booth_scores))
        color, _ = self._classify(overall)

        sorted_booths = sorted(booth_scores, key=lambda b: b.health_score)
        lowest  = sorted_booths[0].booth_id
        highest = sorted_booths[-1].booth_id

        return ConstituencyHealthResult(
            constituency_id=constituency_id,
            overall_score  =overall,
            color          =color,
            booth_scores   =booth_scores,
            lowest_booth   =lowest,
            highest_booth  =highest,
            calculated_at  =datetime.utcnow().isoformat()
        )

    # ── Helpers ──────────────────────────────────────────────────────────────────
    def _safe_pct(self, numerator: int, denominator: int) -> float:
        if denominator == 0:
            return 0.0
        return min((numerator / denominator) * 100, 100.0)

    def _normalize_sentiment(self, score: float) -> float:
        """
        Convert sentiment polarity (-1 to 1) to 0-100 scale.
        If score already 0-1 (pre-normalized), just multiply by 100.
        """
        if -1 <= score <= 1:
            return ((score + 1) / 2) * 100   # maps -1→0, 0→50, 1→100
        return max(0.0, min(score, 100.0))    # already 0-100

    def _classify(self, score: int):
        if score < 40:
            return "Red",   "Critical — Immediate Attention Needed"
        if score <= 70:
            return "Amber", "Monitor Closely"
        return "Green", "Good Standing"


# ─── FastAPI Routes ──────────────────────────────────────────────────────────────
from fastapi import APIRouter

router     = APIRouter(prefix="/api/health", tags=["Health Score"])
calculator = HealthScoreCalculator()

@router.post("/booth", response_model=HealthResult)
async def booth_health(data: HealthInput):
    return calculator.calculate_booth(data)

@router.post("/constituency/{constituency_id}", response_model=ConstituencyHealthResult)
async def constituency_health(constituency_id: str, booths: List[HealthInput]):
    return calculator.calculate_constituency(constituency_id, booths)