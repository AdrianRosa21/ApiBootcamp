import pytest
from fastapi.testclient import TestClient

from app.core.middleware import MAX_BODY_BYTES, BodyLimitMiddleware
from app.main import get_application
from app.services.analyzer_service import analyze_text, compare_texts


@pytest.fixture
def client():
    return TestClient(get_application())


def test_original_contract_and_counts(client):
    text = "Hola mundo. ¿Cómo estás?\n\n¡Muy bien!"
    response = client.post("/api/v1/analyze", json={"text": text})
    assert response.status_code == 200
    data = response.json()
    assert data["original_text"] == text
    assert data["character_count"] == len(text)
    assert data["word_count"] == 6
    assert data["sentence_count"] == 3
    assert data["has_question"] is True
    assert data["sentiment_hint"] == "positivo"
    assert data["paragraph_count"] == 2
    assert data["question_count"] == data["exclamation_count"] == 1
    assert data["characters_without_spaces"] == sum(not c.isspace() for c in text)
    assert data["reading_seconds"] == 2
    assert data["speaking_seconds"] == 3


@pytest.mark.parametrize("text", ["", "   \n\t", "...!!!", "😀", "a" * 50001], ids=["empty", "spaces", "punctuation", "emoji", "oversize"])
def test_invalid_text(client, text):
    response = client.post("/api/v1/analyze", json={"text": text})
    assert response.status_code == 422
    assert "input" not in response.json()


@pytest.mark.parametrize(
    "body", [{}, {"text": 123}, {"text": None}, {"text": "hola", "unknown": True}]
)
def test_invalid_payload(client, body):
    assert client.post("/api/v1/analyze", json=body).status_code == 422


def test_malformed_json_and_content_type(client):
    assert (
        client.post(
            "/api/v1/analyze", content="{broken", headers={"Content-Type": "application/json"}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/v1/analyze", content="hola", headers={"Content-Type": "text/plain"}
        ).status_code
        == 422
    )


def test_maximum_unicode_input(client):
    text = "á" * 50000
    response = client.post("/api/v1/analyze", json={"text": text})
    assert response.status_code == 200
    assert response.json()["character_count"] == 50000
    assert client.post("/api/v1/compare", json={"text_a": text, "text_b": text}).status_code == 200


def test_oversized_body(client):
    response = client.post("/api/v1/analyze", content=b"x" * (MAX_BODY_BYTES + 1))
    assert response.status_code == 413


def test_body_limit_without_content_length():
    import asyncio

    from starlette.responses import PlainTextResponse

    async def run():
        sent = []
        chunks = iter(
            [
                {"type": "http.request", "body": b"x" * 400000, "more_body": True},
                {"type": "http.request", "body": b"x" * 400000, "more_body": False},
            ]
        )

        async def receive():
            return next(chunks)

        async def send(message):
            sent.append(message)

        await BodyLimitMiddleware(PlainTextResponse("must not reach"))(
            {"type": "http"}, receive, send
        )
        assert sent[0]["status"] == 413

    asyncio.run(run())


@pytest.mark.parametrize(
    ("text", "tone"),
    [
        ("No es bueno.", "negativo"),
        ("No es malo.", "positivo"),
        ("This is not good.", "negativo"),
        ("It is very good.", "positivo"),
        ("Es una maleta en Guatemala.", "neutral"),
        ("Excelente, pero terrible.", "neutral"),
        ("No. Es excelente.", "positivo"),
        ("El libro está en la mesa.", "neutral"),
        ("No estoy nada feliz.", "negativo"),
        ("This is awful.", "negativo"),
    ],
)
def test_contextual_sentiment(text, tone):
    assert analyze_text(text)["sentiment_hint"] == tone


def test_intensity_and_repetition():
    assert (
        analyze_text("muy bueno")["sentiment"]["score"]
        > analyze_text("bueno")["sentiment"]["score"]
    )
    assert analyze_text("bueno bueno")["sentiment"]["matched_words"] == 2


def test_unicode_and_punctuation():
    data = analyze_text("Café cafe\u0301, café. 😀 ... ¿Sí?")
    assert data["word_count"] == 4
    assert data["unique_word_count"] == 2
    assert data["sentence_count"] == 2
    assert data["frequent_words"][0] == {"word": "café", "count": 3}


def test_abbreviations_decimals_and_paragraphs():
    data = analyze_text("La Dra. Rosa dice 3.14.\n\nOtro párrafo sin punto")
    assert data["sentence_count"] == 2
    assert data["paragraph_count"] == 2
    assert sum(s["words"] for s in data["sentences"]) == data["word_count"]


def test_no_empty_frequency_and_no_division_by_zero():
    assert analyze_text("el la y")["frequent_words"] == []
    assert analyze_text("")["lexical_diversity"] == 0


def test_compare_contract(client):
    response = client.post(
        "/api/v1/compare", json={"text_a": "sol luna", "text_b": "sol estrella planeta"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["word_delta"] == 1
    assert data["shared_word_count"] == 1
    assert data["vocabulary_overlap"] == 25
    same = compare_texts("Hola, mundo.", "Hola, mundo.")
    assert same["vocabulary_overlap"] == 100
    assert same["word_delta"] == same["sentence_length_delta"] == 0


@pytest.mark.parametrize(
    "body",
    [
        {"text_a": "", "text_b": "Hola"},
        {"text_a": "Hola", "text_b": "!!!"},
        {"text_a": "a" * 50001, "text_b": "Hola"},
    ],
    ids=["empty_a", "punctuation_b", "oversize_a"]
)
def test_compare_validation(client, body):
    assert client.post("/api/v1/compare", json=body).status_code == 422


def test_examples_health_and_cors(client):
    assert client.get("/api/v1/health").json()["status"] == "ok"
    examples = client.get("/api/v1/examples").json()
    assert len(examples) == 3
    for item in examples:
        assert client.post("/api/v1/analyze", json={"text": item["text"]}).status_code == 200
    allowed = client.options(
        "/api/v1/analyze",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
    denied = client.options(
        "/api/v1/analyze",
        headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in denied.headers


def test_errors_and_logs_do_not_leak_text(client, monkeypatch, caplog):
    import app.api.routes as routes

    secret = "PRIVATE_TEST_CONTENT"

    def broken(text):
        raise RuntimeError(text)

    monkeypatch.setattr(routes, "analyze_text", broken)
    response = client.post(
        "/api/v1/analyze", json={"text": secret}, headers={"Origin": "http://localhost:5173"}
    )
    assert response.status_code == 500
    assert secret not in response.text and secret not in caplog.text
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-request-id"]
