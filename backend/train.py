import numpy as np
from data_generator import PairedDataGenerator
from risk_model import ImprovedRiskModel


def train_improved_model():
    """Train the improved risk model with baseline-attempt pairs."""
    
    print("="*60)
    print("TRAINING IMPROVED RISK MODEL")
    print("="*60)
    print("\nThis model detects:")
    print("  - Bots/automation")
    print("  - Impersonation (different person with correct credentials)")
    print("  - Legitimate account owner")
    
    print("\n[1/4] Generating paired training data...")
    generator = PairedDataGenerator(seed=42)
    X, y, metadata = generator.generate_dataset(
        n_samples=15000,
        legitimate_ratio=0.6,
        impersonation_ratio=0.25,
        bot_ratio=0.15
    )
    
    print(f"  Generated {len(y)} samples with {X.shape[1]} features")
    print(f"  - Legitimate: {(y == 0).sum()}")
    print(f"  - Impersonation: {(y == 1).sum()}")
    print(f"  - Bot: {(y == 2).sum()}")
    
    print("\n[2/4] Training model...")
    model = ImprovedRiskModel()
    metrics = model.train(X, y, test_size=0.2)
    
    print("\n[3/4] Evaluation Results:")
    print("-"*60)
    print(f"Train size: {metrics['train_size']}")
    print(f"Test size: {metrics['test_size']}")
    print(f"\nClassification Report:\n{metrics['classification_report']}")
    print(f"Confusion Matrix:\n{metrics['confusion_matrix']}")
    
    print("\n[4/4] Top 15 Feature Importances:")
    print("-"*60)
    importances = sorted(
        metrics['feature_importances'].items(),
        key=lambda x: x[1],
        reverse=True
    )[:15]
    
    for name, importance in importances:
        bar = "█" * int(importance * 100)
        print(f"  {name:30s} {importance:.4f} {bar}")
    
    # Save model
    model.save("improved_model.pkl")
    print("\n✓ Model saved to improved_model.pkl")
    
    # Save training data
    generator.save_dataset(X, y, "paired_training_data.json")
    
    # Analyze deviation features specifically
    print("\n" + "="*60)
    print("DEVIATION FEATURE ANALYSIS")
    print("="*60)
    print("\nThese features compare incoming behavior to stored baseline.")
    print("High importance = key for detecting impersonation.\n")
    
    dev_features = {k: v for k, v in metrics['feature_importances'].items() if k.startswith('dev_')}
    dev_sorted = sorted(dev_features.items(), key=lambda x: x[1], reverse=True)
    
    total_dev_importance = sum(dev_features.values())
    print(f"Total deviation feature importance: {total_dev_importance:.2%}")
    
    for name, importance in dev_sorted:
        print(f"  {name:25s} {importance:.4f}")
    
    return model, metrics


def test_scenarios(model: ImprovedRiskModel):
    """Test model on specific scenarios."""
    
    print("\n" + "="*60)
    print("SCENARIO TESTING")
    print("="*60)
    
    # We'll create synthetic test vectors directly
    feature_names = model.feature_names
    
    # Scenario 1: Legitimate user, normal behavior
    legitimate = np.array([
        # Raw: dwell, dwell_std, flight, speed, velocity, curv, precision, corrections, distance, form_time, first_int, idle
        90, 25, 115, 320, 1.2, 1.3, 10, 3, 4000, 8000, 1200, 15,
        # Deviations: all low (matches baseline)
        0.3, 0.4, 0.5, 0.3, 0.4, 0.5, 0.3, 0.4,
        # Bot signals: all 0
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        # Context: no datacenter, known country, no vpn
        0, 0, 0
    ])
    
    # Scenario 2: Impersonator (different typing/mouse patterns)
    impersonator = np.array([
        # Raw: different rhythm
        70, 18, 85, 420, 1.9, 1.15, 6, 1.8, 3200, 5500, 700, 8,
        # Deviations: HIGH (doesn't match baseline)
        3.2, 2.8, 3.5, 2.9, 3.1, 2.5, 2.8, 2.2,
        # Bot signals: mostly 0 (human-like)
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        # Context: datacenter, new country
        1, 1, 0
    ])
    
    # Scenario 3: Bot attack
    bot = np.array([
        # Raw: inhuman speed and precision
        15, 2, 25, 1200, 12, 1.01, 0.5, 0.1, 600, 300, 50, 0.2,
        # Deviations: very high
        4.5, 4.8, 5.0, 5.0, 4.2, 4.8, 4.5, 4.9,
        # Bot signals: many triggered
        1, 1, 1, 1, 1, 1, 1, 1, 1,
        # Context: datacenter
        1, 1, 0
    ])
    
    scenarios = [
        ("Legitimate user", legitimate, "Should be LOW risk"),
        ("Impersonator", impersonator, "Should be MEDIUM/HIGH risk"),
        ("Bot attack", bot, "Should be HIGH risk"),
    ]
    
    for name, features, expected in scenarios:
        features_scaled = model.scaler.transform(features.reshape(1, -1))
        probs = model.model.predict_proba(features_scaled)[0]
        pred = model.model.predict(features_scaled)[0]
        
        score = int(np.dot(probs, [0, 60, 90]))
        labels = ["legitimate", "impersonation", "bot"]
        
        print(f"\n{name}:")
        print(f"  Prediction: {labels[pred]}")
        print(f"  Risk score: {score}")
        print(f"  Probabilities: legit={probs[0]:.2f}, impersonation={probs[1]:.2f}, bot={probs[2]:.2f}")
        print(f"  Expected: {expected}")


if __name__ == "__main__":
    model, metrics = train_improved_model()
    test_scenarios(model)