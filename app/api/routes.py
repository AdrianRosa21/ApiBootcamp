from fastapi import APIRouter

from app.core.config import settings
from app.schemas.text_analyzer import (
    MAX_TEXT_LENGTH,
    CompareRequest,
    ComparisonResponse,
    Example,
    TextAnalysisRequest,
    TextAnalysisResponse,
)
from app.services.analyzer_service import analyze_text, compare_texts
from app.services.examples import EXAMPLES

router = APIRouter()


@router.get("/health", tags=["System"])
def health() -> dict:
    return {"status": "ok", "version": settings.VERSION, "max_text_length": MAX_TEXT_LENGTH}


@router.get("/examples", response_model=list[Example], tags=["Analysis"])
def examples() -> list[dict]:
    return EXAMPLES


@router.post("/analyze", response_model=TextAnalysisResponse, tags=["Analysis"])
def process_text(request: TextAnalysisRequest) -> dict:
    return analyze_text(request.text)


@router.post("/compare", response_model=ComparisonResponse, tags=["Analysis"])
def compare(request: CompareRequest) -> dict:
    return compare_texts(request.text_a, request.text_b)
