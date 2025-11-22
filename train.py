"""
Training script for fraud detection model.
"""

import os
import sys
from pathlib import Path

from fraud_ml.data_processing import generate_synthetic_dataset
from fraud_ml.feature_extraction import extract_features_batch, FEATURE_NAMES
from fraud_ml.model import train_model, save_model


def main():
    """Main training pipeline."""
    print("="*60)
    print("FRAUD DETECTION MODEL TRAINING")
    print("="*60)
    
    # Step 1: Generate synthetic dataset
    print("\n[1/4] Generating synthetic dataset...")
    n_samples = 10000
    fraud_ratio = 0.3
    
    events = generate_synthetic_dataset(n_samples=n_samples, fraud_ratio=fraud_ratio)
    
    # Step 2: Extract features
    print("\n[2/4] Extracting features...")
    X, y = extract_features_batch(events)
    print(f"Feature matrix shape: {X.shape}")
    print(f"Labels shape: {y.shape}")
    print(f"Number of features: {len(FEATURE_NAMES)}")
    
    # Step 3: Train model
    print("\n[3/4] Training XGBoost model...")
    model = train_model(X, y, test_size=0.2, random_state=42, verbose=True)
    
    # Step 4: Save model
    print("\n[4/4] Saving model...")
    models_dir = Path(__file__).parent.parent / "models"
    models_dir.mkdir(exist_ok=True)
    
    model_path = models_dir / "fraud_model.json"
    save_model(model, str(model_path))
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE")
    print("="*60)
    print(f"\nModel saved to: {model_path}")
    print("\nYou can now use the model for inference:")
    print("  from fraud_ml import score_event")
    print("  result = score_event(event_log)")
    print("="*60)


if __name__ == "__main__":
    main()
