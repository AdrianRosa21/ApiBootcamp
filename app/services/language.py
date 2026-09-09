"""Small, inspectable ES/EN lexicon. No downloads or external text processing."""

import re
import unicodedata

WORD_PATTERN = re.compile(r"[^\W_]+(?:['’\-][^\W_]+)*", re.UNICODE)


def tokens(text: str) -> list[str]:
    return WORD_PATTERN.findall(unicodedata.normalize("NFC", text).lower())


STOP_WORDS = set(
    """
a al algo ante bajo con contra cual cuando de del desde donde durante e el ella
ellas ellos en entre era es esa esas ese eso esos esta estaban estamos estar este
esto estos fue ha hacia hasta hay la las le les lo los más me mi mis muy no nos o
para pero por porque que qué quien se ser si sí sin sobre son su sus te tiene todo
tu tus un una uno unos unas y ya yo
a an and are as at be been but by can do for from had has have he her his how i if
in is it its me my no not of on or our she so than that the their them there these
they this to us was we were what when which who will with you your
""".split()
)

LEXICON: dict[str, float] = {}
for weight, words in (
    (
        1.0,
        "bien bueno buena buenos buenas gracias útil útiles amable claro clara confianza disfrutar disfruta fácil facilita oportunidad oportunidades satisface satisfecho satisfecha solución soluciones avance mejora mejoras mejor positivo positiva apoyo calma tranquilidad",
    ),
    (
        2.0,
        "genial excelente excelentes feliz felices alegría amor encanta encantador increíble maravilloso maravillosa perfecto perfecta éxito fantástico fantástica encantó",
    ),
    (
        -1.0,
        "mal malo mala malos malas error errores problema problemas difícil dificultad confuso confusa lento lenta frustración preocupación preocupa decepción decepcionado negativo negativa falla fallas injusto injusta riesgo riesgos",
    ),
    (
        -2.0,
        "terrible horrible odio pésimo pésima triste tristeza desastre desastroso fracaso dolor insoportable decepcionante frustrante",
    ),
    (
        1.0,
        "good nice useful helpful easy clear calm thanks thank better positive satisfied improve improved improvement trust support enjoy opportunity solution",
    ),
    (
        2.0,
        "great excellent amazing wonderful love happy fantastic perfect awesome success delighted brilliant",
    ),
    (
        -1.0,
        "bad poor difficult slow confusing confused error problem problems concern disappointed negative fail failed risk unfair",
    ),
    (
        -2.0,
        "terrible awful horrible hate sad disaster painful worst frustrating useless disappointing",
    ),
):
    LEXICON.update(dict.fromkeys(words.split(), weight))
NEGATORS = {
    "no",
    "nunca",
    "jamás",
    "sin",
    "ni",
    "not",
    "never",
    "neither",
    "isn't",
    "wasn't",
    "don't",
    "doesn't",
    "can't",
    "cannot",
}
INTENSIFIERS = {
    "muy": 1.5,
    "realmente": 1.3,
    "extremadamente": 1.8,
    "very": 1.5,
    "really": 1.3,
    "extremely": 1.8,
    "poco": 0.5,
    "slightly": 0.5,
}


def estimate_sentiment(text: str, word_count: int) -> dict:
    values: list[float] = []
    # Scope resets at punctuation and contrast markers; inspect only three tokens.
    for clause in re.split(r"[.!?;,\n]+|\b(?:pero|aunque|but|however)\b", text.lower()):
        words = tokens(clause)
        for index, word in enumerate(words):
            if word not in LEXICON:
                continue
            context = words[max(0, index - 3) : index]
            value = LEXICON[word]
            if any(w in NEGATORS for w in context):
                value *= -0.75
            if context and context[-1] in INTENSIFIERS:
                value *= INTENSIFIERS[context[-1]]
            values.append(value)
    score = round(sum(values) / (sum(abs(v) for v in values) + 2), 3) if values else 0.0
    label = "positivo" if score > 0.15 else "negativo" if score < -0.15 else "neutral"
    return {
        "label": label,
        "score": score,
        "matched_words": len(values),
        "coverage": round(100 * len(values) / word_count, 1) if word_count else 0,
        "explanation": "Estimación por léxico español/inglés, negación e intensidad. No detecta sarcasmo ni intención. Neutral también puede significar evidencia insuficiente.",
    }
