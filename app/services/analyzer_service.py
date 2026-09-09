import math
import re
from collections import Counter

from app.services.language import STOP_WORDS, estimate_sentiment, tokens


def sentence_lengths(text: str) -> list[int]:
    # Keep decimals and common abbreviations together. This is not a full parser.
    protected = re.sub(r"(?<=\d)\.(?=\d)", "\u2024", text)
    protected = re.sub(
        r"\b(?:Sr|Sra|Srta|Dr|Dra|Mr|Mrs|Ms|Prof|etc)\.",
        lambda m: m.group().replace(".", "\u2024"),
        protected,
        flags=re.IGNORECASE,
    )
    segments = re.split(r"[.!?]+|\n\s*\n", protected)
    return [n for s in segments if (n := len(tokens(s.replace("\u2024", "."))))]


def analyze_text(text: str) -> dict:
    words = tokens(text)
    count = len(words)
    lengths = sentence_lengths(text)
    frequencies = Counter(w for w in words if w not in STOP_WORDS and not w.isnumeric())
    unique = len(set(words))
    sentiment = estimate_sentiment(text, count)
    long_sentences = sum(n > 25 for n in lengths)
    insights = []
    if long_sentences:
        insights.append(
            f"{long_sentences} oración(es) superan las 25 palabras. Revisa si puedes dividirlas para facilitar la lectura."
        )
    else:
        insights.append(
            "Ninguna oración supera las 25 palabras. La extensión por sí sola no garantiza claridad."
        )
    if frequencies:
        word, frequency = frequencies.most_common(1)[0]
        insights.append(
            f"«{word}» aparece {frequency} vez/veces. Comprueba si la repetición refuerza tu idea o puede reducirse."
        )
    if count < 50:
        insights.append(
            "Muestra breve: la diversidad léxica y el tono pueden cambiar mucho con unas pocas palabras."
        )
    return {
        "original_text": text,
        "character_count": len(text),
        "word_count": count,
        "sentence_count": len(lengths),
        "has_question": "?" in text or "¿" in text,
        "sentiment_hint": sentiment["label"],
        "characters_without_spaces": sum(not c.isspace() for c in text),
        "paragraph_count": sum(bool(tokens(p)) for p in re.split(r"\n\s*\n", text)),
        "question_count": len(re.findall(r"\?+", text)),
        "exclamation_count": len(re.findall(r"!+", text)),
        "average_word_length": round(sum(sum(c.isalnum() for c in w) for w in words) / count, 1)
        if count
        else 0,
        "words_per_sentence": round(count / len(lengths), 1) if lengths else 0,
        "unique_word_count": unique,
        "lexical_diversity": round(100 * unique / count, 1) if count else 0,
        "reading_seconds": math.ceil(count * 60 / 200),
        "speaking_seconds": math.ceil(count * 60 / 130),
        "frequent_words": [{"word": w, "count": n} for w, n in frequencies.most_common(8)],
        "sentences": [{"index": i + 1, "words": n} for i, n in enumerate(lengths)],
        "long_sentence_count": long_sentences,
        "sentiment": sentiment,
        "insights": insights,
    }


def compare_texts(text_a: str, text_b: str) -> dict:
    a, b = analyze_text(text_a), analyze_text(text_b)
    words_a, words_b = set(tokens(text_a)), set(tokens(text_b))
    intersection, union = words_a & words_b, words_a | words_b
    return {
        "a": a,
        "b": b,
        "word_delta": b["word_count"] - a["word_count"],
        "sentence_length_delta": round(b["words_per_sentence"] - a["words_per_sentence"], 1),
        "vocabulary_overlap": round(100 * len(intersection) / len(union), 1) if union else 0,
        "shared_word_count": len(intersection),
    }
