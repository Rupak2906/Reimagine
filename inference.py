"""
Inference engine for real-time fraud detection.
"""

import numpy as np
from typing import Dict, Union, Any
from pathlib import Path
import os

from fraud_ml.utils import EventLog, RiskScore, calculate_risk_level
from fraud_ml.feature_extraction import (
    extract_features_from_event,
    get_feature_importance_explanation,
    FEATURE_NAMES
)
from fraud_ml.model import load_model, predict_risk, get_feature_importances


# Global model cache
_MODEL_CACHE = None
_MODEL_PATH = None


def _get_default_model_path() -> Path:
    """Get the default model path."""
    return Path(__file__).parent.parent / "models" / "fraud_model.json"


def _load_model_if_needed(model_path: str = None):
    """Load model into cache if not already loaded."""
    global _MODEL_CACHE, _MODEL_PATH
    
    if model_path is None:
        model_path = str(_get_default_model_path())
    
    # Load model if not cached or path changed
    if _MODEL_CACHE is None or _MODEL_PATH != model_path:
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file not found: {model_path}\n"
                f"Please run 'python -m fraud_ml.train' to train a model first."
            )
        _MODEL_CACHE = load_model(model_path)
        _MODEL_PATH = model_path
    
    return _MODEL_CACHE


def score_event(
    event_log: Union[Dict, EventLog],
    model_path: str = None,
    explain: bool = True
) -> Dict[str, Any]:
    """
    Score a credit card entry event for fraud risk.
    
    Args:
        event_log: Event log as dictionary or EventLog object
        model_path: Optional path to model file (uses default if None)
        explain: Whether to include feature importance explanations
        
    Returns:
        Dictionary with risk_score, risk_level, and explanations:
        {
            "risk_score": float (0.0-1.0),
            "risk_level": "LOW" | "MEDIUM" | "HIGH",
            "explanations": [list of top feature importances]
        }
    """
    # Load model
    model = _load_model_if_needed(model_path)
    
    # Convert dict to EventLog if needed
    if isinstance(event_log, dict):
        event_log = EventLog(**event_log)
    
    # Extract features
    features = extract_features_from_event(event_log)
    
    # Predict risk score
    risk_score = predict_risk(model, features)
    
    # Determine risk level
    risk_level = calculate_risk_level(risk_score)
    
    # Build result
    result = {
        "risk_score": float(risk_score),
        "risk_level": risk_level.value,
    }
    
    # Add explanations if requested
    if explain:
        # Get feature importances from model
        importances = get_feature_importances(model)
        
        # Calculate contribution scores for this specific prediction
        contributions = features * importances
        
        # Get top contributing features
        top_indices = np.argsort(np.abs(contributions))[::-1][:5]
        
        explanations = []
        for idx in top_indices:
            explanations.append({
                "feature": FEATURE_NAMES[idx],
                "value": float(features[idx]),
                "importance": float(importances[idx]),
                "contribution": float(contributions[idx])
            })
        
        result["explanations"] = explanations
    else:
        result["explanations"] = []
    
    return result


def score_event_batch(
    event_logs: list,
    model_path: str = None,
    explain: bool = False
) -> list:
    """
    Score a batch of events.
    
    Args:
        event_logs: List of event logs (dicts or EventLog objects)
        model_path: Optional path to model file
        explain: Whether to include explanations (slower for batches)
        
    Returns:
        List of result dictionaries
    """
    results = []
    for event_log in event_logs:
        result = score_event(event_log, model_path=model_path, explain=explain)
        results.append(result)
    
    return results


def get_risk_summary(results: list) -> Dict[str, Any]:
    """
    Get summary statistics from a batch of risk scores.
    
    Args:
        results: List of result dictionaries from score_event
        
    Returns:
        Dictionary with summary statistics
    """
    risk_scores = [r["risk_score"] for r in results]
    risk_levels = [r["risk_level"] for r in results]
    
    summary = {
        "total_events": len(results),
        "mean_risk_score": float(np.mean(risk_scores)),
        "median_risk_score": float(np.median(risk_scores)),
        "max_risk_score": float(np.max(risk_scores)),
        "risk_level_counts": {
            "LOW": risk_levels.count("LOW"),
            "MEDIUM": risk_levels.count("MEDIUM"),
            "HIGH": risk_levels.count("HIGH"),
        },
        "high_risk_percentage": risk_levels.count("HIGH") / len(results) * 100,
    }
    
    return summary


# Convenience function for quick testing
def test_inference():
    """Test the inference engine with a sample event."""
    from fraud_ml.data_processing import generate_synthetic_event
    
    print("Testing inference engine...")
    print("="*60)
    
    # Generate test events
    print("\nGenerating test events...")
    legit_event = generate_synthetic_event(is_fraud=False)
    fraud_event = generate_synthetic_event(is_fraud=True)
    
    # Score events
    print("\n1. Legitimate Event:")
    print("-"*60)
    result_legit = score_event(legit_event)
    print(f"Risk Score: {result_legit['risk_score']:.4f}")
    print(f"Risk Level: {result_legit['risk_level']}")
    print("\nTop Contributing Features:")
    for exp in result_legit['explanations']:
        print(f"  - {exp['feature']}: {exp['value']:.4f} "
              f"(importance: {exp['importance']:.4f})")
    
    print("\n2. Fraudulent Event:")
    print("-"*60)
    result_fraud = score_event(fraud_event)
    print(f"Risk Score: {result_fraud['risk_score']:.4f}")
    print(f"Risk Level: {result_fraud['risk_level']}")
    print("\nTop Contributing Features:")
    for exp in result_fraud['explanations']:
        print(f"  - {exp['feature']}: {exp['value']:.4f} "
              f"(importance: {exp['importance']:.4f})")
    
    print("\n" + "="*60)
    print("Inference test complete!")
    print("="*60)


if __name__ == "__main__":
    test_inference()
