"""
AI Speech Generator with Data Injection
Feature 4 — Section 3.5

Generates personalized, data-backed speech drafts using:
- Jinja2 templates for live data injection
- LLM for natural language generation
- Constituency data from DB
"""

from typing import Optional, Dict
from pydantic import BaseModel
from jinja2 import Template
import logging

logger = logging.getLogger(__name__)


# ─── Audience-specific tone guidelines ──────────────────────────────────────────
AUDIENCE_TONE = {
    "Farmers"   : "Use respectful agrarian language. Mention crops, rainfall, irrigation. Address as 'Kisan Bandhu'.",
    "Youth"     : "Use energetic, aspirational language. Mention employment, education, digital India.",
    "Women"     : "Emphasize empowerment, safety, Mahila schemes. Use 'Mata-Behenon' address.",
    "General"   : "Use inclusive, formal Hindi/English mixed tone appropriate for a public address.",
    "Students"  : "Focus on education, scholarships, digital skills, future opportunities.",
    "Seniors"   : "Respectful tone. Mention pension schemes, healthcare, elder care initiatives.",
}

# ─── Jinja2 Data Injection Template ─────────────────────────────────────────────
SPEECH_DATA_TEMPLATE = Template("""
CONSTITUENCY DATA FOR SPEECH:
- Constituency: {{ constituency_name }}
- Total Citizens: {{ total_citizens | default('N/A') }}
- Farmers benefited from PM Kisan: {{ farmers_benefited | default('N/A') }}
- Irrigation projects completed: {{ irrigation_projects | default('N/A') }}
- Scheme coverage percentage: {{ coverage_percentage | default('N/A') }}%
- Active government schemes: {{ active_schemes | default('N/A') }}
- Resolved complaints (last 30 days): {{ resolved_complaints | default('N/A') }}
- Health score: {{ health_score | default('N/A') }}/100
- Budget allocated (crore): {{ budget_allocated | default('N/A') }}
""")

SPEECH_PROMPT_TEMPLATE = """You are a political speechwriter for a senior government leader in India.
Write a compelling, data-backed speech of about 200-250 words.

Topic: {topic}
Audience: {audience}
Tone Guidance: {tone}

{data_block}

Requirements:
- Open with a respectful greeting appropriate to the audience
- Weave the real statistics naturally into the speech
- Use 2-3 concrete achievements with numbers
- End with a forward-looking commitment statement
- Avoid jargon; keep language accessible and inspiring

Speech:"""


# ─── Schemas ────────────────────────────────────────────────────────────────────
class SpeechRequest(BaseModel):
    topic            : str
    audience         : str = "General"
    constituency_id  : Optional[str] = None
    constituency_data: Optional[Dict] = None   # override DB fetch with manual data

class SpeechResult(BaseModel):
    speech          : str
    topic           : str
    audience        : str
    constituency_name: Optional[str]
    data_used       : Dict
    generated_at    : str


# ─── Speech Generator ────────────────────────────────────────────────────────────
class SpeechGenerator:

    def __init__(self, llm=None, db_fetch_fn=None):
        """
        llm         : LangChain-compatible LLM
        db_fetch_fn : async function (constituency_id: str) → Dict of stats
        """
        self.llm          = llm
        self.db_fetch_fn  = db_fetch_fn

    async def generate(self, request: SpeechRequest) -> SpeechResult:
        from datetime import datetime

        # 1. Get constituency data
        data = request.constituency_data or {}
        if not data and request.constituency_id and self.db_fetch_fn:
            data = await self.db_fetch_fn(request.constituency_id)

        # Fill defaults for missing fields
        data.setdefault("constituency_name", request.constituency_id or "Your Constituency")
        data.setdefault("total_citizens"   , "50,000")
        data.setdefault("farmers_benefited", "3,420")
        data.setdefault("irrigation_projects", "12")
        data.setdefault("coverage_percentage", "78")
        data.setdefault("active_schemes"    , "15")
        data.setdefault("resolved_complaints", "342")
        data.setdefault("health_score"      , "74")
        data.setdefault("budget_allocated"  , "2.5")

        # 2. Render Jinja2 data block
        data_block = SPEECH_DATA_TEMPLATE.render(**data)

        # 3. Build prompt
        tone   = AUDIENCE_TONE.get(request.audience, AUDIENCE_TONE["General"])
        prompt = SPEECH_PROMPT_TEMPLATE.format(
            topic     =request.topic,
            audience  =request.audience,
            tone      =tone,
            data_block=data_block
        )

        # 4. Generate
        if self.llm:
            speech = self._call_llm(prompt)
        else:
            speech = self._mock_speech(request, data)

        return SpeechResult(
            speech           =speech,
            topic            =request.topic,
            audience         =request.audience,
            constituency_name=data.get("constituency_name"),
            data_used        =data,
            generated_at     =datetime.utcnow().isoformat()
        )

    def _call_llm(self, prompt: str) -> str:
        try:
            result = self.llm.invoke(prompt)
            return result if isinstance(result, str) else result.content
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            return self._fallback_speech()

    def _mock_speech(self, request: SpeechRequest, data: Dict) -> str:
        return (
            f"Respected {request.audience} of our constituency, "
            f"I am proud to share that over {data['farmers_benefited']} farmers have benefited "
            f"from the PM Kisan Samman Nidhi scheme in the last year. "
            f"Our government has completed {data['irrigation_projects']} new irrigation projects "
            f"benefiting dozens of villages. We have allocated an additional "
            f"₹{data['budget_allocated']} crore for welfare programs in this budget. "
            f"Our constituency health score stands at {data['health_score']}/100, and we are "
            f"committed to making it 100. Together, we will build a stronger, more prosperous future."
        )

    def _fallback_speech(self) -> str:
        return "Speech generation encountered an error. Please try again."


# ─── FastAPI Route ───────────────────────────────────────────────────────────────
from fastapi import APIRouter

router    = APIRouter(prefix="/api/speech", tags=["Speech Generator"])
generator = SpeechGenerator(llm=None)

def init_speech_generator(llm, db_fetch_fn=None):
    global generator
    generator = SpeechGenerator(llm=llm, db_fetch_fn=db_fetch_fn)

@router.post("/generate", response_model=SpeechResult)
async def generate_speech(request: SpeechRequest):
    return await generator.generate(request)