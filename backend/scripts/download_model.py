#!/usr/bin/env python3
"""
Pre-download the sentence-transformers embedding model.

Run this script once before starting the backend to cache the model locally.
This prevents the ChromaDB initialization hang on first startup.

Usage:
    python backend/scripts/download_model.py
"""

from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"

if __name__ == "__main__":
    print(f"Downloading and caching model: {MODEL_NAME}")
    print("This may take 1-3 minutes on first run...")
    
    model = SentenceTransformer(MODEL_NAME)
    
    # Test the model with a sample sentence
    test_embedding = model.encode(["Test sentence for embedding"])
    
    print(f"Model downloaded and cached successfully!")
    print(f"Embedding dimension: {len(test_embedding[0])}")
    print(f"Model location: ~/.cache/torch/sentence_transformers/")
