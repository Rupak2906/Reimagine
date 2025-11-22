"""
Feature extraction for fraud detection.
"""

import numpy as np
from typing import List, Dict, Any, Tuple
from fraud_ml.utils import (
    EventLog, calculate_entropy, calculate_coefficient_of_variation
)


# Browser and OS rarity scores (lower = more common)
BROWSER_RARITY = {
    "Chrome": 0.1, "Firefox": 0.2, "Safari": 0.15, "Edge": 0.25,
    "Opera": 0.4, "IE": 0.8, "Brave": 0.5, "Vivaldi": 0.6
}

OS_RARITY = {
    "Windows 11": 0.15, "Windows 10": 0.1, "macOS": 0.2,
    "Linux": 0.4, "iOS": 0.15, "Android": 0.2,
    "Windows 7": 0.8, "ChromeOS": 0.3
}

# Feature names for reference
FEATURE_NAMES = [
    "typing_speed_mean",
    "typing_speed_variance",
    "typing_speed_cv",
    "typing_rhythm_entropy",
    "backspace_ratio",
    "avg_key_pressure",
    "mouse_jitter",
    "mouse_path_entropy",
    "browser_rarity",
    "os_rarity",
    "screen_res_common",
    "timezone_match_country",
    "is_vpn",
    "geo_distance_normalized",
    "country_risk",
    "time_of_day_risk",
    "velocity_attempts",
    "velocity_risk",
]


def extract_typing_features(event: EventLog) -> Dict[str, float]:
    """
    Extract features from typing behavior.
    
    Args:
        event: EventLog object
        
    Returns:
        Dictionary of typing-related features
    """
    intervals = np.array(event.typing_intervals)
    
    # Basic statistics
    typing_speed_mean = float(np.mean(intervals))
    typing_speed_variance = float(np.var(intervals))
    
    # Coefficient of variation (std/mean) - measures consistency
    typing_speed_cv = calculate_coefficient_of_variation(event.typing_intervals)
    
    # Rhythm entropy - measures predictability
    typing_rhythm_entropy = calculate_entropy(event.typing_intervals)
    
    # Backspace ratio (higher may indicate uncertainty)
    num_chars = len(event.typing_intervals)
    backspace_ratio = event.backspace_count / max(num_chars, 1)
    
    return {
        "typing_speed_mean": typing_speed_mean,
        "typing_speed_variance": typing_speed_variance,
        "typing_speed_cv": typing_speed_cv,
        "typing_rhythm_entropy": typing_rhythm_entropy,
        "backspace_ratio": backspace_ratio,
        "avg_key_pressure": event.avg_key_pressure,
    }


def extract_mouse_features(event: EventLog) -> Dict[str, float]:
    """
    Extract features from mouse behavior.
    
    Args:
        event: EventLog object
        
    Returns:
        Dictionary of mouse-related features
    """
    return {
        "mouse_jitter": event.mouse_jitter,
        "mouse_path_entropy": event.mouse_path_entropy,
    }


def extract_device_features(event: EventLog) -> Dict[str, float]:
    """
    Extract features from device fingerprint.
    
    Args:
        event: EventLog object
        
    Returns:
        Dictionary of device-related features
    """
    device = event.device_fingerprint
    
    # Browser rarity score
    browser_name = device.browser.split()[0]  # Extract browser name
    browser_rarity = BROWSER_RARITY.get(browser_name, 0.5)
    
    # OS rarity score
    os_name = None
    for os_key in OS_RARITY.keys():
        if os_key in device.os:
            os_name = os_key
            break
    os_rarity = OS_RARITY.get(os_name, 0.5) if os_name else 0.5
    
    # Screen resolution commonality (common resolutions = 0, rare = 1)
    common_resolutions = ["1920x1080", "1366x768", "1440x900", "2560x1440"]
    screen_res_common = 0.0 if device.screen_res in common_resolutions else 1.0
    
    return {
        "browser_rarity": browser_rarity,
        "os_rarity": os_rarity,
        "screen_res_common": screen_res_common,
    }


def extract_geolocation_features(event: EventLog) -> Dict[str, float]:
    """
    Extract features from geolocation and IP information.
    
    Args:
        event: EventLog object
        
    Returns:
        Dictionary of geolocation-related features
    """
    ip_info = event.ip_info
    device = event.device_fingerprint
    
    # Timezone-country match (simplified heuristic)
    # US timezones should match US country, etc.
    timezone_country_map = {
        "America": ["US", "CA", "MX", "BR", "AR"],
        "Europe": ["GB", "DE", "FR", "IT", "ES", "NL", "SE", "CH"],
        "Asia": ["JP", "CN", "IN", "KR", "SG"],
        "Australia": ["AU"],
    }
    
    timezone_match_country = 0.0
    for tz_region, countries in timezone_country_map.items():
        if tz_region in device.timezone and ip_info.country in countries:
            timezone_match_country = 1.0
            break
    
    # VPN flag (binary)
    is_vpn = 1.0 if ip_info.is_vpn else 0.0
    
    # Geo distance normalization (log scale)
    geo_distance_normalized = float(np.log1p(event.geo_distance_km) / np.log1p(20000))
    
    # Country risk score (higher for suspicious countries)
    suspicious_countries = ["RU", "UA", "NG", "PK", "BD", "VN", "CN"]
    country_risk = 1.0 if ip_info.country in suspicious_countries else 0.0
    
    return {
        "timezone_match_country": timezone_match_country,
        "is_vpn": is_vpn,
        "geo_distance_normalized": geo_distance_normalized,
        "country_risk": country_risk,
    }


def extract_temporal_features(event: EventLog) -> Dict[str, float]:
    """
    Extract features from temporal patterns.
    
    Args:
        event: EventLog object
        
    Returns:
        Dictionary of temporal-related features
    """
    # Time of day risk (higher for unusual hours)
    unusual_hours = [0, 1, 2, 3, 4, 5, 23]
    time_of_day_risk = 1.0 if event.time_of_day in unusual_hours else 0.0
    
    return {
        "time_of_day_risk": time_of_day_risk,
    }


def extract_velocity_features(event: EventLog) -> Dict[str, float]:
    """
    Extract features from velocity signals.
    
    Args:
        event: EventLog object
        
    Returns:
        Dictionary of velocity-related features
    """
    # Raw velocity count
    velocity_attempts = float(event.velocity_attempts_last_hour)
    
    # Velocity risk (normalized)
    velocity_risk = min(velocity_attempts / 10.0, 1.0)
    
    return {
        "velocity_attempts": velocity_attempts,
        "velocity_risk": velocity_risk,
    }


def extract_features_from_event(event: EventLog) -> np.ndarray:
    """
    Extract all features from a single event log.
    
    Args:
        event: EventLog object
        
    Returns:
        Feature vector as numpy array
    """
    features = {}
    
    # Extract all feature groups
    features.update(extract_typing_features(event))
    features.update(extract_mouse_features(event))
    features.update(extract_device_features(event))
    features.update(extract_geolocation_features(event))
    features.update(extract_temporal_features(event))
    features.update(extract_velocity_features(event))
    
    # Convert to ordered array based on FEATURE_NAMES
    feature_vector = [features[name] for name in FEATURE_NAMES]
    
    return np.array(feature_vector, dtype=np.float32)


def extract_features_batch(events: List[EventLog]) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extract features from a batch of event logs.
    
    Args:
        events: List of EventLog objects
        
    Returns:
        Tuple of (X, y) where X is feature matrix and y is labels
    """
    X = []
    y = []
    
    for event in events:
        features = extract_features_from_event(event)
        X.append(features)
        if event.label is not None:
            y.append(event.label)
    
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32) if y else None
    
    return X, y


def get_feature_importance_explanation(
    feature_importances: np.ndarray,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Get top-k most important features with explanations.
    
    Args:
        feature_importances: Array of feature importance scores
        top_k: Number of top features to return
        
    Returns:
        List of dictionaries with feature names and importance scores
    """
    # Get top-k indices
    top_indices = np.argsort(feature_importances)[::-1][:top_k]
    
    explanations = []
    for idx in top_indices:
        explanations.append({
            "feature": FEATURE_NAMES[idx],
            "importance": float(feature_importances[idx]),
            "rank": len(explanations) + 1
        })
    
    return explanations
