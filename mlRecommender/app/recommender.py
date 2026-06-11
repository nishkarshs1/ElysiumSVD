import os
from typing import Optional
import numpy as np
import pandas as pd
import joblib

U: Optional[np.ndarray] = None
sigma: Optional[np.ndarray] = None
Vt: Optional[np.ndarray] = None
ratings_df: Optional[pd.DataFrame] = None
user_ratings_mean: Optional[np.ndarray] = None

def load_model():
    global U, sigma, Vt, ratings_df, user_ratings_mean
    
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__)) # Pointing to 'app/'
    BASE_DIR = os.path.dirname(CURRENT_DIR)                  # Pointing to 'mlRecommender/' root
    MODEL_DIR = os.path.join(BASE_DIR, "model")              # Absolute path to 'model/'
    
    print(f"System loading binary frames directly from: {MODEL_DIR}")
    
    U = joblib.load(os.path.join(MODEL_DIR, "U.pkl"))
    sigma = joblib.load(os.path.join(MODEL_DIR, "sigma.pkl"))
    Vt = joblib.load(os.path.join(MODEL_DIR, "Vt.pkl"))
    ratings_df = joblib.load(os.path.join(MODEL_DIR, "ratings_df.csv"))
    user_ratings_mean = joblib.load(os.path.join(MODEL_DIR, "user_ratings_mean.pkl"))

    print("Model loaded successfully")

def get_recommendations(user_id: int, n: int = 5):
    global U, sigma, Vt, ratings_df, user_ratings_mean
    
    # 2. Defensive Guard: Type narrowing for Pylance + API Safety
    if U is None or sigma is None or Vt is None or ratings_df is None or user_ratings_mean is None:
        raise RuntimeError("Model components are not loaded. Please call load_model() first.")

    # Now Pylance knows for sure that U, sigma, Vt, and ratings_df are NOT None
    if user_id >= U.shape[0]:
        global_scores = np.dot(np.diag(sigma), Vt).mean(axis=0)
        top_n = np.argsort(global_scores)[::-1][:n]
        return {"user_id": user_id, "recommendations": top_n.tolist(), "cold_start": True}

    Sigma = np.diag(sigma)
    R_predicted_user = np.dot(np.dot(U[user_id], Sigma), Vt) + user_ratings_mean[user_id]
    user_scores = np.clip(R_predicted_user, 1, 5)

    # Exclude products the user already rated
    already_rated = ratings_df[ratings_df['user_id'] == user_id]['product_id'].values
    user_scores[already_rated] = -999

    top_n = np.argsort(user_scores)[::-1][:n]
    return {"user_id": user_id, "recommendations": top_n.tolist(), "cold_start": False}

def get_similar_products(product_id: int, n: int = 5):
    global Vt
    
    if Vt is None:
        raise RuntimeError("Model components are not loaded. Please call load_model() first.")

    if product_id >= Vt.shape[1]:
        return {"product_id": product_id, "similar": []}

    product_vec = Vt[:, product_id]
    dot_products = np.dot(Vt.T, product_vec)
    norms = np.linalg.norm(Vt, axis=0)
    prod_norm = np.linalg.norm(product_vec)
    
    cos_sims = dot_products / (prod_norm * norms + 1e-9)
    cos_sims[product_id] = -1.0
    
    top_indices = np.argsort(cos_sims)[::-1][:n]
    
    similar = [
        {"product_id": int(pid), "similarity": round(float(cos_sims[pid]), 4)} 
        for pid in top_indices
    ]
    return {"product_id": product_id, "similar": similar}

def get_latent_space() -> list[dict]:
    """
    Extract the first 2 principal components of each product's latent vector.
    Vt shape is (k, num_products) — each column is one product's latent factors.
    We slice Vt[0, pid] and Vt[1, pid] to get the 2D coordinates.
    """

    # Type-narrowing safety check — Pylance needs explicit None guards
    # before it allows numpy indexing on optional globals
    if Vt is None:
        raise ValueError("Model not loaded. Call load_model() first.")

    if Vt.shape[0] < 2:
        raise ValueError(
            f"Vt has only {Vt.shape[0]} latent dimensions. "
            "Need at least 2 for 2D projection."
        )

    num_products: int = Vt.shape[1]

    result: list[dict] = [
        {
            "product_id": pid,
            "coordinates": {
                # Vt[0, pid] = projection onto 1st principal component (x-axis)
                # Vt[1, pid] = projection onto 2nd principal component (y-axis)
                # float() converts numpy scalar → plain Python float for JSON safety
                "x": float(Vt[0, pid]),
                "y": float(Vt[1, pid]),
            },
        }
        for pid in range(num_products)
    ]

    return result