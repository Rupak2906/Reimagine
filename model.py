"""
Machine learning model for fraud detection using XGBoost.
"""

import numpy as np
from typing import Union, Optional, Any
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report, 
confusion_matrix
import joblib
import os


def train_model(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float = 0.2,
    random_state: int = 42,
    verbose: bool = True
) -> xgb.XGBClassifier:
    """
    Train an XGBoost classifier for fraud detection.
    
    Args:
        X: Feature matrix (n_samples, n_features)
        y: Labels (n_samples,)
        test_size: Proportion of data for testing
        random_state: Random seed for reproducibility
        verbose: Whether to print training progress
        
    Returns:
        Trained XGBoost model
    """
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    if verbose:
        print(f"\nTraining XGBoost model...")
        print(f"Train set: {X_train.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        print(f"Fraud ratio (train): {np.mean(y_train):.2%}")
    
    # Configure XGBoost model
    # Using parameters optimized for fraud detection
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        min_child_weight=3,
        gamma=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='binary:logistic',
        scale_pos_weight=1,  # Can adjust for class imbalance
        random_state=random_state,
        n_jobs=-1,
        eval_metric='auc'
    )
    
    # Train model
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=verbose
    )
    
    # Evaluate model
    if verbose:
        print("\n" + "="*60)
        print("MODEL EVALUATION")
        print("="*60)
        
        # Training set performance
        y_train_pred = model.predict(X_train)
        y_train_proba = model.predict_proba(X_train)[:, 1]
        train_accuracy = accuracy_score(y_train, y_train_pred)
        train_auc = roc_auc_score(y_train, y_train_proba)
        
        print(f"\nTraining Set:")
        print(f"  Accuracy: {train_accuracy:.4f}")
        print(f"  ROC-AUC:  {train_auc:.4f}")
        
        # Test set performance
        y_test_pred = model.predict(X_test)
        y_test_proba = model.predict_proba(X_test)[:, 1]
        test_accuracy = accuracy_score(y_test, y_test_pred)
        test_auc = roc_auc_score(y_test, y_test_proba)
        
        print(f"\nTest Set:")
        print(f"  Accuracy: {test_accuracy:.4f}")
        print(f"  ROC-AUC:  {test_auc:.4f}")
        
        # Classification report
        print(f"\nClassification Report (Test Set):")
        print(classification_report(y_test, y_test_pred, target_names=['Legitimate', 'Fraud']))
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_test_pred)
        print(f"\nConfusion Matrix (Test Set):")
        print(f"                Predicted")
        print(f"              Legit  Fraud")
        print(f"Actual Legit  {cm[0][0]:5d}  {cm[0][1]:5d}")
        print(f"       Fraud  {cm[1][0]:5d}  {cm[1][1]:5d}")
        
        print("="*60)
    
    return model


def predict_risk(
    model: xgb.XGBClassifier,
    features: Union[np.ndarray, list]
) -> float:
    """
    Predict fraud risk score for a single event or batch.
    
    Args:
        model: Trained XGBoost model
        features: Feature vector(s) - can be 1D (single) or 2D (batch)
        
    Returns:
        Risk score(s) between 0.0 and 1.0
    """
    # Convert to numpy array if needed
    if isinstance(features, list):
        features = np.array(features, dtype=np.float32)
    
    # Reshape if single sample
    if features.ndim == 1:
        features = features.reshape(1, -1)
        single_sample = True
    else:
        single_sample = False
    
    # Get probability predictions
    probas = model.predict_proba(features)[:, 1]
    
    # Return single value or array
    if single_sample:
        return float(probas[0])
    else:
        return probas


def save_model(model: xgb.XGBClassifier, path: str) -> None:
    """
    Save trained model to disk.
    
    Args:
        model: Trained XGBoost model
        path: File path to save the model
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    # Save using XGBoost's native format (JSON)
    if path.endswith('.json'):
        model.save_model(path)
    else:
        # Use joblib for pickle format
        joblib.dump(model, path)
    
    print(f"Model saved to: {path}")


def load_model(path: str) -> xgb.XGBClassifier:
    """
    Load trained model from disk.
    
    Args:
        path: File path to the saved model
        
    Returns:
        Loaded XGBoost model
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")
    
    # Load using appropriate method
    if path.endswith('.json'):
        model = xgb.XGBClassifier()
        model.load_model(path)
    else:
        model = joblib.load(path)
    
    print(f"Model loaded from: {path}")
    return model


def get_feature_importances(model: xgb.XGBClassifier) -> np.ndarray:
    """
    Get feature importance scores from trained model.
    
    Args:
        model: Trained XGBoost model
        
    Returns:
        Array of feature importance scores
    """
    return model.feature_importances_


def explain_prediction(
    model: xgb.XGBClassifier,
    features: np.ndarray,
    feature_names: list
) -> dict:
    """
    Explain a single prediction using feature importances.
    
    Args:
        model: Trained XGBoost model
        features: Feature vector for a single sample
        feature_names: List of feature names
        
    Returns:
        Dictionary with prediction explanation
    """
    # Get prediction
    risk_score = predict_risk(model, features)
    
    # Get feature importances
    importances = get_feature_importances(model)
    
    # Calculate contribution scores (feature value * importance)
    contributions = features * importances
    
    # Get top contributing features
    top_indices = np.argsort(np.abs(contributions))[::-1][:5]
    
    explanation = {
        "risk_score": float(risk_score),
        "top_features": [
            {
                "name": feature_names[idx],
                "value": float(features[idx]),
                "importance": float(importances[idx]),
                "contribution": float(contributions[idx])
            }
            for idx in top_indices
        ]
    }
    
    return explanation

