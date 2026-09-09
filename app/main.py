import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import settings
from app.core.middleware import BodyLimitMiddleware

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("lexico")


def get_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Análisis de estructura, vocabulario y tono. Sin almacenamiento de textos en el servidor.",
    )
    application.include_router(router, prefix=settings.API_PREFIX)
    application.add_middleware(BodyLimitMiddleware)

    @application.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Default Pydantic errors echo input; do not reflect submitted text.
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Introduce texto válido de 1 a 50.000 caracteres, con al menos una palabra.",
                "fields": [".".join(str(p) for p in e["loc"]) for e in exc.errors()],
            },
        )

    @application.middleware("http")
    async def request_context(request: Request, call_next):
        request_id = uuid4().hex
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # Exception messages and payloads may contain private text.
            logger.error("request_failed id=%s", request_id)
            response = JSONResponse(
                status_code=500,
                content={
                    "detail": "No pudimos completar el análisis. Inténtalo de nuevo.",
                    "request_id": request_id,
                },
            )
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        logger.info(
            "request id=%s method=%s status=%d elapsed_ms=%.1f",
            request_id,
            request.method,
            response.status_code,
            (time.perf_counter() - started) * 1000,
        )
        return response

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    return application


app = get_application()


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"message": f"Bienvenido a {settings.PROJECT_NAME}", "docs": "/docs"}
