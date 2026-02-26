"""3D Snake Game - Main Application Entry Point."""

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from src.api.routes import router

app = FastAPI(
    title="3D Snake Game API",
    description="Backend API for the 3D Snake game with WebSocket support",
    version="0.1.0",
)


def add_cors_middleware(app: FastAPI) -> None:
    """Add CORS middleware to the FastAPI app."""

    app.add_middleware(  # noqa: PLC0415, E501
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )


add_cors_middleware(app)


@app.get("/")
def root() -> dict[str, str]:
    """
    Root endpoint providing API information.

    Returns:
        API name and version.
    """
    return {
        "name": app.title,
        "version": app.version,
        "docs": "/docs",
    }


app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    from src.config.settings import settings

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
