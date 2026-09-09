import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_TEXT_LENGTH = 50_000


class TextAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=1, max_length=MAX_TEXT_LENGTH)

    @field_validator("text")
    @classmethod
    def contains_words(cls, value: str) -> str:
        if not re.search(r"[^\W_]", value, re.UNICODE):
            raise ValueError("Escribe al menos una palabra o un número.")
        return value


class FrequentWord(BaseModel):
    word: str
    count: int


class SentenceMetric(BaseModel):
    index: int
    words: int


class Sentiment(BaseModel):
    label: Literal["positivo", "negativo", "neutral"]
    score: float
    matched_words: int
    coverage: float
    method: str = "lexicon-context-v1"
    explanation: str


class TextAnalysisResponse(BaseModel):
    original_text: str
    character_count: int
    word_count: int
    sentence_count: int
    has_question: bool
    sentiment_hint: str
    characters_without_spaces: int
    paragraph_count: int
    question_count: int
    exclamation_count: int
    average_word_length: float
    words_per_sentence: float
    unique_word_count: int
    lexical_diversity: float
    reading_seconds: int
    speaking_seconds: int
    frequent_words: list[FrequentWord]
    sentences: list[SentenceMetric]
    long_sentence_count: int
    sentiment: Sentiment
    insights: list[str]
    analyzer_version: str = "2.0.0"


class CompareRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text_a: str
    text_b: str

    @field_validator("text_a", "text_b")
    @classmethod
    def validate_text(cls, value: str) -> str:
        return TextAnalysisRequest(text=value).text


class ComparisonResponse(BaseModel):
    a: TextAnalysisResponse
    b: TextAnalysisResponse
    word_delta: int
    sentence_length_delta: float
    vocabulary_overlap: float
    shared_word_count: int


class Example(BaseModel):
    id: str
    title: str
    category: str
    description: str
    text: str
