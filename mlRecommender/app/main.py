import time
from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel

from app.recommender import (
    load_model,
    get_recommendations,
    get_similar_products,
    get_latent_space,
    get_movie_titles,
)


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield


app = FastAPI(
    title="ML Recommender API",
    description="Matrix Factorization (SVD) based movie recommendations — MovieLens 1M",
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Middleware ───────────────────────────────────────────────────────────────

from typing import Awaitable, Callable

@app.middleware("http")
async def performance_logging_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],  # Wrapped Response in Awaitable
) -> Response:
    """
    Intercepts every request. For /recommend/ and /similar/ routes,
    measures execution time with perf_counter (highest resolution timer
    available in Python — unaffected by system clock adjustments).
    """
    path: str = request.url.path
    should_log: bool = "/recommend/" in path or "/similar/" in path

    if should_log:
        t_start: float = time.perf_counter()

    # Pylance is now happy because it knows call_next returns an Awaitable
    response: Response = await call_next(request)

    if should_log:
        t_end: float = time.perf_counter()
        # perf_counter returns seconds — multiply by 1000 for milliseconds
        elapsed_ms: float = (t_end - t_start) * 1000
        print(f"[PERF] {path} took {elapsed_ms:.2f}ms | Latency optimized")

    return response

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ─── Response Schemas ────────────────────────────────────────────────────────

class RecommendationResponse(BaseModel):
    user_id: int
    recommendations: list[int]
    cold_start: bool = False


class SimilarProduct(BaseModel):
    product_id: int
    similarity: float


class SimilarResponse(BaseModel):
    product_id: int
    similar: list[SimilarProduct]


class Coordinates(BaseModel):
    x: float
    y: float


class LatentSpacePoint(BaseModel):
    product_id: int
    coordinates: Coordinates


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/recommend/{user_id}", response_model=RecommendationResponse)
def recommend(user_id: int, n: int = 5) -> RecommendationResponse:
    if user_id < 0:
        raise HTTPException(status_code=400, detail="user_id must be non-negative")
    if n < 1 or n > 20:
        raise HTTPException(status_code=400, detail="n must be between 1 and 20")
    return RecommendationResponse(**get_recommendations(user_id, n))


@app.get("/similar/{product_id}", response_model=SimilarResponse)
def similar(product_id: int, n: int = 5) -> SimilarResponse:
    if product_id < 0:
        raise HTTPException(status_code=400, detail="product_id must be non-negative")
    return SimilarResponse(**get_similar_products(product_id, n))


@app.get("/api/v1/latent-space", response_model=list[LatentSpacePoint])
def latent_space() -> list[LatentSpacePoint]:
    """
    Returns every product's position in the 2D latent factor space.
    The frontend can plot these coordinates to visualise how the model
    has clustered products by inferred similarity.
    """
    try:
        points = get_latent_space()
        return [LatentSpacePoint(**p) for p in points]
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.get("/movies")
def movies() -> dict:
    """
    Returns a mapping of product_id (0-indexed int) to movie title string.
    Frontend uses this to display real movie names.
    """
    try:
        return get_movie_titles()
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))