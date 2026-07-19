---
name: api-text-analyzer
description: Provee capacidades avanzadas de análisis de texto al agente utilizando una API FastAPI local, permitiéndole extraer métricas y determinar el sentimiento del texto ingresado por el usuario.
---

# API Text Analyzer Skill

Esta skill dota al agente con la capacidad de enriquecer sus respuestas al interactuar con el usuario mediante el uso de la API local de Análisis de Texto (FastAPI).

## Cuándo usar esta skill
- Cuando el usuario te pida analizar, evaluar o extraer métricas (conteo de palabras, oraciones, sentimiento) de un bloque de texto.
- Cuando necesites procesar un texto muy largo y quieras delegar el análisis cuantitativo a una herramienta determinista.

## Instrucciones para el Agente

1. **Recepción del Texto**: Cuando el usuario pida analizar un texto, asegúrate de tener el texto exacto que necesita análisis.
2. **Uso de la API Local**: Debes ejecutar un comando `curl` (o equivalente mediante Python/PowerShell) apuntando a la API local que debe estar corriendo en `http://localhost:8000/api/v1/analyze`.
3. **Payload a enviar**: 
   Debes enviar un payload JSON con la estructura:
   ```json
   {
     "text": "El texto que el usuario quiere analizar"
   }
   ```
4. **Ejecución del Request**:
   ```bash
   curl -X 'POST' \
     'http://localhost:8000/api/v1/analyze' \
     -H 'accept: application/json' \
     -H 'Content-Type: application/json' \
     -d '{
     "text": "El texto del usuario aquí"
   }'
   ```
5. **Interpretación y Respuesta**: 
   - Analiza el JSON devuelto por la API (el cual contendrá `word_count`, `sentence_count`, `has_question`, `sentiment_hint`, etc.).
   - Modifica tu comportamiento natural: NO hagas tú el conteo de palabras; confía exclusivamente en el resultado de la API.
   - Presenta el resultado al usuario de una manera amigable y resumida, destacando las métricas obtenidas por la herramienta local.

## Restricciones
- No inventes métricas de conteo de palabras; utiliza siempre la respuesta de la API local.
- Si la API no responde (por ejemplo, porque el servidor FastAPI está apagado), indícale al usuario: "Por favor, asegúrate de iniciar el servidor de la API ejecutando `uvicorn app.main:app --reload` en tu terminal local antes de pedirme que analice un texto".
