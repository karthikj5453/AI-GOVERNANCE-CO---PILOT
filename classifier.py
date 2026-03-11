"""
AI-Powered Complaint Intelligence System
Layer 3 - AI Intelligence Engine: Section 3.2

- BERT-based complaint classification (6 categories)
- Urgency scoring algorithm
- Department routing
- Affected area extraction
"""

import re
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


# ─── Constants ─────────────────────────────────────────────────────────────────
CATEGORIES = {
    "Infrastructure" : ["road", "water", "electricity", "bridge", "drainage", "pipe", "supply", "power", "light", "street"],
    "Healthcare"     : ["hospital", "clinic", "doctor", "medicine", "health", "ambulance", "nurse", "medical"],
    "Sanitation"     : ["garbage", "waste", "sewage", "clean", "trash", "smell", "toilet", "hygiene", "litter"],
    "Law & Order"    : ["police", "crime", "theft", "safety", "violence", "harassment", "security", "illegal"],
    "Corruption"     : ["bribe", "corrupt", "misuse", "fraud", "misappropriation", "illegal", "money", "demand"],
    "Welfare Schemes": ["scheme", "benefit", "pension", "ration", "pm kisan", "eligibility", "subsidy", "card", "enrollment"],
}

DEPARTMENT_MAP = {
    "Infrastructure" : "Public Works Department",
    "Healthcare"     : "Health Department",
    "Sanitation"     : "Municipal Sanitation Department",
    "Law & Order"    : "Police Department",
    "Corruption"     : "Vigilance Department",
    "Welfare Schemes": "Social Welfare Department",
}

URGENCY_KEYWORDS = {
    "critical": ["emergency", "death", "fire", "flood", "accident", "immediate", "critical", "urgent", "collapse"],
    "high"    : ["weeks", "days", "no supply", "irregular", "broken", "blocked", "multiple", "repeated"],
    "medium"  : ["slow", "delayed", "pending", "not resolved", "months"],
    "low"     : ["request", "suggestion", "query", "information"],
}

RESOLUTION_TIME = {
    "critical": "12 hours",
    "high"    : "48 hours",
    "medium"  : "7 days",
    "low"     : "15 days",
}


# ─── Schemas ────────────────────────────────────────────────────────────────────
class ComplaintInput(BaseModel):
    complaint_text: str
    citizen_id    : Optional[str] = None
    booth_id      : Optional[str] = None
    location      : Optional[str] = None

class ComplaintOutput(BaseModel):
    complaint_id            : str
    category                : str
    subcategory             : str
    urgency                 : str
    urgency_score           : float
    department              : str
    affected_area           : Optional[str]
    estimated_resolution_time: str
    similar_complaints_hint : str
    processed_at            : str


# ─── Classifier ────────────────────────────────────────────────────────────────
class ComplaintClassifier:
    """
    Keyword-based classifier (works without GPU for hackathon demo).
    Swap _classify_category() internals with a fine-tuned BERT model
    by calling HuggingFace pipeline — interface stays identical.
    """

    def classify(self, complaint: ComplaintInput) -> ComplaintOutput:
        text_lower = complaint.complaint_text.lower()

        category, subcategory = self._classify_category(text_lower)
        urgency, urgency_score = self._score_urgency(text_lower)
        department = DEPARTMENT_MAP.get(category, "General Administration")
        affected_area = self._extract_area(complaint.complaint_text, complaint.location)

        return ComplaintOutput(
            complaint_id=str(uuid.uuid4()),
            category=category,
            subcategory=subcategory,
            urgency=urgency.title(),
            urgency_score=round(urgency_score, 2),
            department=department,
            affected_area=affected_area,
            estimated_resolution_time=RESOLUTION_TIME[urgency],
            similar_complaints_hint="Query complaints table for category+booth_id match.",
            processed_at=datetime.utcnow().isoformat()
        )

    def _classify_category(self, text: str):
        scores = {}
        for category, keywords in CATEGORIES.items():
            scores[category] = sum(1 for kw in keywords if kw in text)

        best_category = max(scores, key=scores.get)
        if scores[best_category] == 0:
            best_category = "Infrastructure"  # default fallback

        # Derive subcategory from matched keyword
        matched_keywords = [kw for kw in CATEGORIES[best_category] if kw in text]
        subcategory = matched_keywords[0].title() if matched_keywords else best_category

        return best_category, subcategory

    def _score_urgency(self, text: str):
        for level in ["critical", "high", "medium", "low"]:
            for kw in URGENCY_KEYWORDS[level]:
                if kw in text:
                    score_map = {"critical": 0.95, "high": 0.80, "medium": 0.55, "low": 0.25}
                    return level, score_map[level]

        # Heuristic: longer complaints usually indicate ongoing issues
        word_count = len(text.split())
        if word_count > 40:
            return "medium", 0.50
        return "low", 0.20

    def _extract_area(self, text: str, location: Optional[str]) -> Optional[str]:
        if location:
            return location
        # Simple pattern matching for ward/booth mentions
        patterns = [r"ward\s*\d+", r"booth\s*\d+", r"area\s*\w+", r"sector\s*\d+"]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).title()
        return None


# ─── Optional: BERT-based Classifier (uncomment when GPU available) ─────────────
# from transformers import pipeline as hf_pipeline
#
# class BERTComplaintClassifier(ComplaintClassifier):
#     def __init__(self):
#         self.pipe = hf_pipeline(
#             "text-classification",
#             model="bert-base-uncased",   # replace with your fine-tuned model
#             top_k=1
#         )
#
#     def _classify_category(self, text: str):
#         result = self.pipe(text)[0]
#         category = result["label"]
#         return category, category


# ─── FastAPI Route ───────────────────────────────────────────────────────────────
from fastapi import APIRouter

router     = APIRouter(prefix="/api/complaints", tags=["Complaints"])
classifier = ComplaintClassifier()

@router.post("/ingest", response_model=ComplaintOutput)
async def ingest_complaint(complaint: ComplaintInput):
    """Classify a citizen complaint and return structured output."""
    return classifier.classify(complaint)

@router.post("/batch-ingest", response_model=List[ComplaintOutput])
async def batch_ingest(complaints: List[ComplaintInput]):
    """Classify multiple complaints at once."""
    return [classifier.classify(c) for c in complaints]