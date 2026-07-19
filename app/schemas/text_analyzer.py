from pydantic import BaseModel, Field

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, description="El texto que se desea analizar")

class TextAnalysisResponse(BaseModel):
    original_text: str
    character_count: int
    word_count: int
    sentence_count: int
    has_question: bool
    sentiment_hint: str
