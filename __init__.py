"""
Fraud ML - Credit Card Entry Fraud Detection Engine

A machine learning package for detecting fraudulent credit card entry attempts
using behavioral patterns, device signals, geolocation, and velocity signals.
"""

__version__ = "0.1.0"
__author__ = "Fraud Detection Team"

from fraud_ml.inference import score_event
from fraud_ml.model import train_model, save_model, load_model, predict_risk

__all__ = [
    "score_event",
    "train_model",
    "save_model",
    "load_model",
    "predict_risk",
]
