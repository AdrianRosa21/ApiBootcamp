from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router

def get_application() -> FastAPI:
    """
    Inicializa y configura la aplicación FastAPI.
    """
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="API para análisis de texto e integración de Agent Skills."
    )

    # Configuración de CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Inclusión de Rutas
    application.include_router(router, prefix=settings.API_PREFIX)

    return application

app = get_application()

@app.get("/")
async def root():
    return {"message": f"Bienvenido a {settings.PROJECT_NAME} v{settings.VERSION}. Visita /docs para probar la API."}
