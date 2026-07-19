import re

def analyze_text(text: str) -> dict:
    """
    Realiza un análisis básico del texto proporcionado.
    """
    char_count = len(text)
    
    # Contar palabras
    words = [w for w in re.split(r'\s+', text) if w]
    word_count = len(words)
    
    # Contar oraciones de forma básica (separadas por . ! ?)
    sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
    sentence_count = len(sentences)
    
    # Detectar pregunta
    has_question = '?' in text
    
    # Análisis simple de palabras clave para "sentimiento" o tono
    lower_text = text.lower()
    positive_words = ['bien', 'bueno', 'genial', 'excelente', 'feliz', 'gracias', 'mejor', 'positivo']
    negative_words = ['mal', 'malo', 'terrible', 'triste', 'peor', 'error', 'problema', 'negativo']
    
    pos_count = sum(1 for word in positive_words if word in lower_text)
    neg_count = sum(1 for word in negative_words if word in lower_text)
    
    sentiment_hint = "neutral"
    if pos_count > neg_count:
        sentiment_hint = "positivo"
    elif neg_count > pos_count:
        sentiment_hint = "negativo"
        
    return {
        "original_text": text,
        "character_count": char_count,
        "word_count": word_count,
        "sentence_count": sentence_count,
        "has_question": has_question,
        "sentiment_hint": sentiment_hint
    }
