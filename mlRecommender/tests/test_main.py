import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.recommender import load_model

client = TestClient(app)

# Fixture to load model once before all tests run
@pytest.fixture(scope="session", autouse=True)
def setup_model():
    try:
        load_model()
    except Exception:
        # If pickle files are missing, mock with synthetic dummy data
        import numpy as np
        import pandas as pd
        import app.recommender as rec
        
        rec.U = np.random.rand(10, 3)
        rec.sigma = np.array([2.5, 1.5, 0.5])
        rec.Vt = np.random.rand(3, 20)
        rec.ratings_df = pd.DataFrame({'user_id': [0, 1], 'movie_id': [2, 3]})
        rec.user_ratings_mean = np.random.rand(10)
        rec.movie_titles = {i: f"Test Movie {i}" for i in range(20)}
        print("Mocked model components for testing")

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_recommend_valid_user():
    r = client.get("/recommend/0")
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) == 5

def test_recommend_invalid_n():
    r = client.get("/recommend/0?n=99")
    assert r.status_code in [400, 422] 

def test_similar_movies():
    r = client.get("/similar/5")
    assert r.status_code == 200
    assert "similar" in r.json()