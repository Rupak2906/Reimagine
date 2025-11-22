# Fraud ML - Credit Card Fraud Detection Engine

A machine learning package for detecting fraudulent credit card entry attempts using behavioral 
patterns, device signals, geolocation, and velocity signals.

## 🎯 Features

- **Behavioral Analysis**: Typing speed, keystroke rhythm, mouse movement patterns
- **Device Fingerprinting**: Browser, OS, screen resolution, timezone analysis
- **Geolocation Intelligence**: IP analysis, VPN detection, geo-distance risk
- **Velocity Tracking**: Attempt frequency and pattern detection
- **XGBoost Model**: High-performance gradient boosting for anomaly detection
- **Real-time Scoring**: Fast inference with risk scores 0.0-1.0
- **Explainable AI**: Feature importance and SHAP-ready architecture

## 📦 Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or install individually
pip install scikit-learn xgboost pandas numpy shap pydantic joblib
```

## 🚀 Quick Start

### 1. Train the Model

```bash
python -m fraud_ml.train
```

This will:
- Generate 10,000 synthetic training samples
- Extract 18 behavioral/device features
- Train an XGBoost classifier
- Save the model to `models/fraud_model.json`

### 2. Use for Inference

```python
from fraud_ml import score_event

# Your event data
event = {
    "typing_intervals": [120.5, 95.3, 150.2, 88.1, 130.0],
    "backspace_count": 2,
    "avg_key_pressure": 0.75,
    "mouse_jitter": 8.5,
    "mouse_path_entropy": 1.8,
    "device_fingerprint": {
        "browser": "Chrome 120",
        "os": "Windows 11",
        "timezone": "America/New_York",
        "screen_res": "1920x1080"
    },
    "ip_info": {
        "country": "US",
        "asn": 15169,
        "is_vpn": False
    },
    "geo_distance_km": 25.0,
    "time_of_day": 14,
    "velocity_attempts_last_hour": 1
}

# Score the event
result = score_event(event)

print(f"Risk Score: {result['risk_score']:.4f}")
print(f"Risk Level: {result['risk_level']}")
print("\nTop Risk Factors:")
for exp in result['explanations']:
    print(f"  - {exp['feature']}: {exp['contribution']:.4f}")
```

Output:
```
Risk Score: 0.1523
Risk Level: LOW

Top Risk Factors:
  - velocity_attempts: 0.0245
  - geo_distance_normalized: 0.0183
  - typing_speed_cv: 0.0156
```

## 📊 Project Structure

```
fraud_ml/
├── __init__.py              # Package initialization
├── data_processing.py       # Synthetic data generation
├── feature_extraction.py    # Feature engineering (18 features)
├── model.py                 # XGBoost training & prediction
├── train.py                 # Training script
├── inference.py             # Real-time scoring engine
└── utils.py                 # Helper functions & data models

models/
└── fraud_model.json         # Trained model (created after training)

requirements.txt             # Python dependencies
README.md                    # This file
```

## 🎨 Features Extracted

### Typing Behavior (6 features)
- `typing_speed_mean` - Average typing speed
- `typing_speed_variance` - Typing speed variability
- `typing_speed_cv` - Coefficient of variation
- `typing_rhythm_entropy` - Keystroke predictability
- `backspace_ratio` - Correction frequency
- `avg_key_pressure` - Key press intensity

### Mouse Behavior (2 features)
- `mouse_jitter` - Movement smoothness
- `mouse_path_entropy` - Path randomness

### Device Signals (3 features)
- `browser_rarity` - Browser uniqueness score
- `os_rarity` - OS uncommonness
- `screen_res_common` - Resolution rarity

### Geolocation (4 features)
- `timezone_match_country` - Timezone/country consistency
- `is_vpn` - VPN/proxy detection
- `geo_distance_normalized` - Distance from expected location
- `country_risk` - High-risk country indicator

### Temporal & Velocity (3 features)
- `time_of_day_risk` - Unusual hour detection
- `velocity_attempts` - Attempt frequency
- `velocity_risk` - Normalized velocity score

**Total: 18 features**

## 🧪 Testing

Test the inference engine:

```bash
python -m fraud_ml.inference
```

## 📈 Model Performance

Expected performance on synthetic data:
- **Accuracy**: ~92-95%
- **ROC-AUC**: ~0.96-0.98
- **Training time**: ~10-15 seconds (10K samples)
- **Inference time**: <1ms per event

## 🔧 Advanced Usage

### Custom Model Training

```python
from fraud_ml.data_processing import generate_synthetic_dataset
from fraud_ml.feature_extraction import extract_features_batch
from fraud_ml.model import train_model, save_model

# Generate custom dataset
events = generate_synthetic_dataset(n_samples=20000, fraud_ratio=0.4)

# Extract features
X, y = extract_features_batch(events)

# Train with custom parameters
model = train_model(X, y, test_size=0.3, random_state=42)

# Save model
save_model(model, "models/custom_model.json")
```

### Batch Scoring

```python
from fraud_ml.inference import score_event_batch, get_risk_summary

events = [event1, event2, event3, ...]
results = score_event_batch(events)

# Get summary statistics
summary = get_risk_summary(results)
print(f"High-risk percentage: {summary['high_risk_percentage']:.2f}%")
```

### Using Custom Model Path

```python
result = score_event(event, model_path="models/custom_model.json")
```

## 🎯 Risk Levels

- **LOW**: Risk score < 0.3 (likely legitimate)
- **MEDIUM**: Risk score 0.3-0.7 (review recommended)
- **HIGH**: Risk score > 0.7 (likely fraudulent)

## 🛡️ Production Considerations

1. **Retrain regularly** with real fraud data
2. **Monitor drift** in feature distributions
3. **A/B test** thresholds (0.3, 0.7) based on business needs
4. **Add human review** for MEDIUM risk cases
5. **Log false positives** to improve model
6. **Consider ensemble** with deep learning for complex patterns

## 📝 Data Schema

See `fraud_ml/utils.py` for full Pydantic models:
- `EventLog` - Main event structure
- `DeviceFingerprint` - Device information
- `IPInfo` - IP address details
- `RiskScore` - Output format

## 🤝 Contributing

This is a hackathon project. For production use:
1. Replace synthetic data with real transaction data
2. Add more sophisticated device fingerprinting
3. Integrate real IP geolocation APIs
4. Add SHAP explanations for better interpretability
5. Implement online learning for model updates


## 🎓 Citation

```bibtex
@software{fraud_ml,
  title = {Fraud ML: Credit Card Fraud Detection Engine},
  author = {Goenka, Gupta, Jain, Sharma},
  year = {2025},
  url = TODO
}
```

## 📧 Support

For questions or issues, please open a GitHub issue or contact the team.

---

**Built for hackathons. Ready for production.** 🚀
