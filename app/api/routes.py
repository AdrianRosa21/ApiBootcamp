from fastapi import APIRouter, HTTPException
from app.schemas.text_analyzer import TextAnalysisRequest, TextAnalysisResponse
from app.services.analyzer_service import analyze_text

router = APIRouter()

@router.post("/analyze", response_model=TextAnalysisResponse, summary="Analiza un texto proporcionado")
async def process_text(request: TextAnalysisRequest):
    """
    Recibe un texto a través de un payload JSON y retorna un análisis estructurado.
    
    - **text**: Cadena de texto obligatoria (min_length=1).
    """
    try:
        # Llama a la lógica de negocio desacoplada
        analysis_result = analyze_text(request.text)
        return TextAnalysisResponse(**analysis_result)
    except Exception as e:
        # Manejo de errores básicos
        raise HTTPException(status_code=500, detail=f"Error procesando el texto: {str(e)}")
