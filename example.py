"""
Example usage of the fraud detection engine.
"""

from fraud_ml import score_event
from fraud_ml.data_processing import generate_synthetic_event
from fraud_ml.inference import score_event_batch, get_risk_summary
import json


def example_1_basic_scoring():
    """Example 1: Basic event scoring."""
    print("="*70)
    print("EXAMPLE 1: Basic Event Scoring")
    print("="*70)
    
    # Sample event data (legitimate user)
    event = {
        "typing_intervals": [120.5, 95.3, 150.2, 88.1, 130.0, 110.2, 125.8, 
                            98.5, 135.2, 105.7, 115.3, 122.1, 108.9, 118.5],
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
    
    print(f"\nRisk Score: {result['risk_score']:.4f}")
    print(f"Risk Level: {result['risk_level']}")
    print("\nTop Risk Factors:")
    for i, exp in enumerate(result['explanations'], 1):
        print(f"  {i}. {exp['feature']:<25} "
              f"Value: {exp['value']:>7.4f}  "
              f"Contribution: {exp['contribution']:>7.4f}")
    print()


def example_2_suspicious_event():
    """Example 2: Scoring a suspicious event."""
    print("="*70)
    print("EXAMPLE 2: Suspicious Event (VPN + Fast Typing)")
    print("="*70)
    
    # Suspicious event - VPN, very fast typing
    event = {
        "typing_intervals": [35.2, 38.5, 32.1, 40.2, 33.8, 36.5, 34.2, 
                            37.8, 31.5, 39.2, 35.8, 33.2, 36.8, 34.5],
        "backspace_count": 8,
        "avg_key_pressure": 0.45,
        "mouse_jitter": 25.3,
        "mouse_path_entropy": 3.2,
        "device_fingerprint": {
            "browser": "Firefox 80",
            "os": "Linux Ubuntu",
            "timezone": "Europe/London",
            "screen_res": "1280x720"
        },
        "ip_info": {
            "country": "RU",
            "asn": 12345,
            "is_vpn": True
        },
        "geo_distance_km": 5500.0,
        "time_of_day": 3,
        "velocity_attempts_last_hour": 8
    }
    
    result = score_event(event)
    
    print(f"\nRisk Score: {result['risk_score']:.4f}")
    print(f"Risk Level: {result['risk_level']}")
    print("\nTop Risk Factors:")
    for i, exp in enumerate(result['explanations'], 1):
        print(f"  {i}. {exp['feature']:<25} "
              f"Value: {exp['value']:>7.4f}  "
              f"Contribution: {exp['contribution']:>7.4f}")
    print()


def example_3_batch_processing():
    """Example 3: Batch processing and summary."""
    print("="*70)
    print("EXAMPLE 3: Batch Processing")
    print("="*70)
    
    # Generate a mix of events
    print("\nGenerating 20 test events (10 legit, 10 fraud)...")
    events = []
    for _ in range(10):
        events.append(generate_synthetic_event(is_fraud=False))
    for _ in range(10):
        events.append(generate_synthetic_event(is_fraud=True))
    
    # Score all events
    print("Scoring events...")
    results = score_event_batch(events, explain=False)
    
    # Get summary
    summary = get_risk_summary(results)
    
    print(f"\n{'Metric':<30} {'Value':>10}")
    print("-"*42)
    print(f"{'Total Events':<30} {summary['total_events']:>10}")
    print(f"{'Mean Risk Score':<30} {summary['mean_risk_score']:>10.4f}")
    print(f"{'Median Risk Score':<30} {summary['median_risk_score']:>10.4f}")
    print(f"{'Max Risk Score':<30} {summary['max_risk_score']:>10.4f}")
    print()
    print(f"{'Risk Level Distribution':}")
    print(f"  {'LOW':<27} {summary['risk_level_counts']['LOW']:>10}")
    print(f"  {'MEDIUM':<27} {summary['risk_level_counts']['MEDIUM']:>10}")
    print(f"  {'HIGH':<27} {summary['risk_level_counts']['HIGH']:>10}")
    print()
    print(f"{'High-Risk Percentage':<30} {summary['high_risk_percentage']:>9.2f}%")
    print()


def example_4_json_integration():
    """Example 4: JSON integration (API-ready)."""
    print("="*70)
    print("EXAMPLE 4: JSON Integration (API-Ready)")
    print("="*70)
    
    # Event as JSON string (e.g., from API request)
    event_json = json.dumps({
        "typing_intervals": [115.0, 102.3, 128.5, 95.7, 118.2, 110.5],
        "backspace_count": 1,
        "avg_key_pressure": 0.72,
        "mouse_jitter": 9.2,
        "mouse_path_entropy": 1.95,
        "device_fingerprint": {
            "browser": "Safari 17",
            "os": "macOS 14",
            "timezone": "America/Los_Angeles",
            "screen_res": "2880x1800"
        },
        "ip_info": {
            "country": "US",
            "asn": 7922,
            "is_vpn": False
        },
        "geo_distance_km": 15.0,
        "time_of_day": 10,
        "velocity_attempts_last_hour": 1
    })
    
    print("\nInput JSON:")
    print(json.dumps(json.loads(event_json), indent=2)[:300] + "...")
    
    # Parse and score
    event = json.loads(event_json)
    result = score_event(event)
    
    # Output as JSON
    print("\nOutput JSON:")
    print(json.dumps(result, indent=2))
    print()


def example_5_real_time_simulation():
    """Example 5: Real-time scoring simulation."""
    print("="*70)
    print("EXAMPLE 5: Real-Time Scoring Simulation")
    print("="*70)
    
    print("\nSimulating 5 incoming transactions...\n")
    
    for i in range(5):
        # Generate random event
        is_fraud = i % 3 == 0  # Every 3rd is fraud for demo
        event = generate_synthetic_event(is_fraud=is_fraud)
        
        # Score immediately
        result = score_event(event, explain=False)
        
        # Display result
        status_icon = "🔴" if result['risk_level'] == "HIGH" else \
                     "🟡" if result['risk_level'] == "MEDIUM" else "🟢"
        
        print(f"Transaction #{i+1}: {status_icon} "
              f"Risk={result['risk_score']:.4f} "
              f"Level={result['risk_level']:<6} "
              f"(Actual: {'FRAUD' if is_fraud else 'LEGIT'})")
    
    print()


def main():
    """Run all examples."""
    print("\n")
    print("╔" + "═"*68 + "╗")
    print("║" + " "*20 + "FRAUD ML - EXAMPLES" + " "*29 + "║")
    print("╚" + "═"*68 + "╝")
    print()
    
    try:
        example_1_basic_scoring()
        input("Press Enter to continue to Example 2...")
        
        example_2_suspicious_event()
        input("Press Enter to continue to Example 3...")
        
        example_3_batch_processing()
        input("Press Enter to continue to Example 4...")
        
        example_4_json_integration()
        input("Press Enter to continue to Example 5...")
        
        example_5_real_time_simulation()
        
        print("="*70)
        print("All examples completed successfully!")
        print("="*70)
        print("\nNext steps:")
        print("  1. Train your own model: python -m fraud_ml.train")
        print("  2. Integrate into your API")
        print("  3. Collect real data and retrain")
        print("="*70)
        print()
        
    except FileNotFoundError as e:
        print("\n ERROR: Model not found!")
        print("\nPlease train the model first:")
        print("  python -m fraud_ml.train")
        print()


if __name__ == "__main__":
    main()

