"""
Predictive Issue Alert System
Feature 5 — Section 3.6

Algorithms:
- Simple moving averages for trend detection
- XGBoost/LightGBM for risk level classification
- Optional LSTM for time-series forecasting
"""

from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime, timedelta
import statistics
import logging

logger = logging.getLogger(__name__)


# ─── Schemas ────────────────────────────────────────────────────────────────────
class ComplaintDataPoint(BaseModel):
    date    : str        # ISO date string
    booth_id: str
    category: str
    count   : int

class PredictiveAlert(BaseModel):
    booth_id      : str
    category      : str
    alert_message : str
    risk_level    : str           # LOW | MEDIUM | HIGH | CRITICAL
    pct_change    : float         # % increase vs previous period
    current_count : int
    previous_count: int
    recommended_action: str
    similar_past_pattern: Optional[str]
    generated_at  : str

class AlertBatch(BaseModel):
    alerts      : List[PredictiveAlert]
    total_alerts: int
    generated_at: str


# ─── Thresholds ─────────────────────────────────────────────────────────────────
RISK_THRESHOLDS = {
    "CRITICAL": 60,    # >60% increase → Critical
    "HIGH"    : 30,    # 30-60%       → High
    "MEDIUM"  : 15,    # 15-30%       → Medium
    # below 15% → LOW (no alert)
}

RECOMMENDED_ACTIONS = {
    "Water"      : "Dispatch field inspection team. Contact Water Department immediately.",
    "Road"       : "Raise maintenance request with PWD. Schedule site visit.",
    "Electricity": "Alert electricity board for audit. Check for transformer issues.",
    "Sanitation" : "Deploy municipal cleaning crew. Inspect drainage systems.",
    "Healthcare" : "Coordinate with health department. Increase mobile health camp frequency.",
    "Law & Order": "Brief local police station. Increase patrol in affected booths.",
    "Default"    : "Escalate to relevant department. Schedule ground-level review.",
}


# ─── Predictive Alert Engine ─────────────────────────────────────────────────────
class PredictiveAlertEngine:

    def __init__(self, window_days: int = 7, use_ml: bool = False):
        self.window_days = window_days
        self.use_ml      = use_ml
        self._model      = None

        if use_ml:
            self._load_ml_model()

    def detect_surges(self, data_points: List[ComplaintDataPoint]) -> AlertBatch:
        """
        Detect complaint surges by comparing current vs previous rolling window.
        data_points: sorted by date, may span multiple booths and categories.
        """
        grouped   = self._group_data(data_points)
        alerts    = []

        for (booth_id, category), series in grouped.items():
            alert = self._analyse_series(booth_id, category, series)
            if alert:
                alerts.append(alert)

        # Sort by risk level severity
        priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        alerts.sort(key=lambda a: priority_order.get(a.risk_level, 9))

        return AlertBatch(
            alerts      =alerts,
            total_alerts=len(alerts),
            generated_at=datetime.utcnow().isoformat()
        )

    # ── Internal ─────────────────────────────────────────────────────────────────
    def _group_data(self, points: List[ComplaintDataPoint]) -> Dict:
        from collections import defaultdict
        grouped = defaultdict(list)
        for p in points:
            grouped[(p.booth_id, p.category)].append((p.date, p.count))
        # Sort each group chronologically
        for key in grouped:
            grouped[key].sort(key=lambda x: x[0])
        return grouped

    def _analyse_series(self, booth_id, category, series) -> Optional[PredictiveAlert]:
        if len(series) < 2:
            return None

        counts = [c for _, c in series]
        n      = max(1, len(counts) // 2)

        current_window  = counts[-n:]
        previous_window = counts[:n]

        current_avg  = statistics.mean(current_window)
        previous_avg = statistics.mean(previous_window) or 0.1   # avoid div/0

        pct_change = ((current_avg - previous_avg) / previous_avg) * 100

        if pct_change < RISK_THRESHOLDS["MEDIUM"]:
            return None    # No significant surge — skip

        risk_level = self._classify_risk(pct_change)
        current_total  = sum(current_window)
        previous_total = sum(previous_window)

        return PredictiveAlert(
            booth_id      =booth_id,
            category      =category,
            alert_message =(
                f"ALERT: {category} complaints increased {pct_change:.0f}% "
                f"in last {n} days in {booth_id}"
            ),
            risk_level    =risk_level,
            pct_change    =round(pct_change, 1),
            current_count =current_total,
            previous_count=previous_total,
            recommended_action=RECOMMENDED_ACTIONS.get(category, RECOMMENDED_ACTIONS["Default"]),
            similar_past_pattern=self._find_similar_pattern(category, pct_change),
            generated_at  =datetime.utcnow().isoformat()
        )

    def _classify_risk(self, pct_change: float) -> str:
        if pct_change >= RISK_THRESHOLDS["CRITICAL"]: return "CRITICAL"
        if pct_change >= RISK_THRESHOLDS["HIGH"]    : return "HIGH"
        return "MEDIUM"

    def _find_similar_pattern(self, category: str, pct_change: float) -> Optional[str]:
        """Static pattern hints — replace with DB query in production."""
        patterns = {
            "Water"      : "Similar surge seen in Ward 15 (March 2025) — resolved with emergency pipe repair.",
            "Electricity": "Similar spike in Booth 22 (Jan 2025) — transformer replacement resolved in 3 days.",
            "Road"       : "Previous road complaint surge preceded monsoon season.",
        }
        return patterns.get(category)

    # ── Optional ML Model ────────────────────────────────────────────────────────
    def _load_ml_model(self):
        try:
            import xgboost as xgb
            # Load pre-trained model: xgb.Booster().load_model("xgb_risk_model.json")
            logger.info("XGBoost model loaded (stub — train and save model first).")
        except ImportError:
            logger.warning("XGBoost not installed. Using statistical threshold detection.")
            self.use_ml = False

    def predict_risk_ml(self, features: Dict) -> str:
        """
        Use trained XGBoost model for risk classification.
        features: dict of engineered features (trend slope, std_dev, seasonality, etc.)
        Returns: risk level string
        """
        if not self.use_ml or not self._model:
            raise RuntimeError("ML model not loaded.")
        import numpy as np
        X      = np.array([[features[k] for k in sorted(features.keys())]])
        pred   = self._model.predict(X)[0]
        levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        return levels[min(int(pred), 3)]


# ─── FastAPI Routes ──────────────────────────────────────────────────────────────
from fastapi import APIRouter

router = APIRouter(prefix="/api/alerts", tags=["Predictive Alerts"])
engine = PredictiveAlertEngine(window_days=7, use_ml=False)

@router.post("/detect", response_model=AlertBatch)
async def detect_surges(data_points: List[ComplaintDataPoint]):
    """Detect complaint surges from historical data points."""
    return engine.detect_surges(data_points)

@router.get("/booth/{booth_id}", response_model=AlertBatch)
async def get_booth_alerts(booth_id: str):
    """Get latest alerts for a specific booth (stub — wire to DB in production)."""
    return AlertBatch(alerts=[], total_alerts=0, generated_at=datetime.utcnow().isoformat())