"""
Data processing and synthetic data generation for fraud detection.
"""

import numpy as np
from typing import List, Dict, Tuple
import random
from fraud_ml.utils import EventLog, DeviceFingerprint, IPInfo


# Common browsers, OS, timezones, and screen resolutions
BROWSERS = [
    "Chrome 120", "Firefox 121", "Safari 17", "Edge 120",
    "Chrome 119", "Firefox 120", "Safari 16", "Opera 105"
]

OPERATING_SYSTEMS = [
    "Windows 11", "Windows 10", "macOS 14", "macOS 13",
    "Linux Ubuntu", "iOS 17", "Android 14", "ChromeOS"
]

TIMEZONES = [
    "America/New_York", "America/Los_Angeles", "America/Chicago",
    "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai",
    "Australia/Sydney", "America/Toronto", "Europe/Berlin"
]

SCREEN_RESOLUTIONS = [
    "1920x1080", "1366x768", "1440x900", "2560x1440",
    "1536x864", "1280x720", "3840x2160", "2880x1800"
]

COUNTRIES = [
    "US", "GB", "CA", "DE", "FR", "JP", "CN", "AU", "IN", "BR",
    "IT", "ES", "NL", "SE", "CH", "KR", "SG", "MX", "AR", "ZA"
]

# Suspicious countries/regions (higher fraud correlation)
SUSPICIOUS_COUNTRIES = ["RU", "UA", "NG", "PK", "BD", "VN"]


def generate_legitimate_typing_pattern() -> List[float]:
    """
    Generate realistic typing intervals for legitimate users.
    Normal users have consistent rhythm with some natural variation.
    
    Returns:
        List of typing intervals in milliseconds
    """
    base_speed = np.random.uniform(80, 200)  # Base typing speed
    num_chars = random.randint(12, 20)  # Credit card number length + variations
    
    intervals = []
    for _ in range(num_chars):
        # Natural variation around base speed
        interval = np.random.normal(base_speed, base_speed * 0.3)
        interval = max(50, interval)  # Minimum 50ms
        intervals.append(interval)
    
    # Add occasional pauses (thinking/checking card)
    for i in random.sample(range(len(intervals)), k=random.randint(1, 3)):
        intervals[i] *= random.uniform(2, 4)
    
    return intervals


def generate_fraudulent_typing_pattern() -> List[float]:
    """
    Generate typing patterns typical of fraudsters.
    Often very fast (copy-paste simulation) or very irregular.
    
    Returns:
        List of typing intervals in milliseconds
    """
    pattern_type = random.choice(["bot", "fast_manual", "irregular"])
    num_chars = random.randint(12, 20)
    
    if pattern_type == "bot":
        # Very fast, very consistent (automated)
        base_speed = np.random.uniform(20, 60)
        intervals = [base_speed + np.random.uniform(-5, 5) for _ in range(num_chars)]
    
    elif pattern_type == "fast_manual":
        # Suspiciously fast but slightly irregular
        base_speed = np.random.uniform(40, 80)
        intervals = [base_speed + np.random.uniform(-20, 20) for _ in range(num_chars)]
    
    else:  # irregular
        # Very inconsistent timing (nervous, uncertain)
        intervals = [np.random.uniform(50, 400) for _ in range(num_chars)]
    
    return intervals


def generate_device_fingerprint(is_fraud: bool) -> DeviceFingerprint:
    """
    Generate device fingerprint.
    Fraudsters more likely to use outdated browsers, VPNs, unusual configs.
    
    Args:
        is_fraud: Whether this is a fraudulent event
        
    Returns:
        DeviceFingerprint object
    """
    if is_fraud and random.random() < 0.4:
        # Outdated or rare browser/OS combo
        browser = random.choice(["Chrome 90", "Firefox 80", "IE 11", "Opera 60"])
        os = random.choice(["Windows 7", "Windows XP", "Linux Kali"])
        timezone = random.choice(TIMEZONES + ["UTC", "GMT"])
        screen_res = random.choice(["1024x768", "800x600", "1280x1024"])
    else:
        browser = random.choice(BROWSERS)
        os = random.choice(OPERATING_SYSTEMS)
        timezone = random.choice(TIMEZONES)
        screen_res = random.choice(SCREEN_RESOLUTIONS)
    
    return DeviceFingerprint(
        browser=browser,
        os=os,
        timezone=timezone,
        screen_res=screen_res
    )


def generate_ip_info(is_fraud: bool) -> IPInfo:
    """
    Generate IP information.
    Fraudsters more likely to use VPNs and suspicious locations.
    
    Args:
        is_fraud: Whether this is a fraudulent event
        
    Returns:
        IPInfo object
    """
    if is_fraud:
        # Higher chance of VPN and suspicious countries
        is_vpn = random.random() < 0.6
        if random.random() < 0.4:
            country = random.choice(SUSPICIOUS_COUNTRIES)
        else:
            country = random.choice(COUNTRIES)
    else:
        is_vpn = random.random() < 0.1
        country = random.choice(COUNTRIES)
    
    asn = random.randint(1000, 65000)
    
    return IPInfo(country=country, asn=asn, is_vpn=is_vpn)


def generate_synthetic_event(is_fraud: bool) -> EventLog:
    """
    Generate a single synthetic event log.
    
    Args:
        is_fraud: Whether to generate a fraudulent event
        
    Returns:
        EventLog object
    """
    # Typing patterns
    if is_fraud:
        typing_intervals = generate_fraudulent_typing_pattern()
        backspace_count = random.randint(0, 3) if random.random() < 0.7 else random.randint(5, 
15)
        avg_key_pressure = random.uniform(0.3, 0.8)  # Often lighter or inconsistent
    else:
        typing_intervals = generate_legitimate_typing_pattern()
        backspace_count = random.randint(0, 5)
        avg_key_pressure = random.uniform(0.5, 0.9)
    
    # Mouse behavior
    if is_fraud:
        mouse_jitter = random.uniform(15, 50)  # Higher jitter
        mouse_path_entropy = random.uniform(2.5, 4.0)  # More erratic
    else:
        mouse_jitter = random.uniform(2, 15)
        mouse_path_entropy = random.uniform(1.0, 2.5)
    
    # Device and IP
    device_fingerprint = generate_device_fingerprint(is_fraud)
    ip_info = generate_ip_info(is_fraud)
    
    # Geo distance
    if is_fraud:
        # Often far from expected location or very close (compromised local device)
        if random.random() < 0.7:
            geo_distance_km = random.uniform(500, 10000)
        else:
            geo_distance_km = random.uniform(0, 50)
    else:
        geo_distance_km = random.uniform(0, 200)
    
    # Time of day (fraudsters often operate at odd hours)
    if is_fraud and random.random() < 0.5:
        time_of_day = random.choice([0, 1, 2, 3, 4, 5, 22, 23])
    else:
        time_of_day = random.randint(0, 23)
    
    # Velocity (fraudsters often try multiple times)
    if is_fraud:
        velocity_attempts_last_hour = random.randint(3, 20)
    else:
        velocity_attempts_last_hour = random.randint(0, 3)
    
    return EventLog(
        typing_intervals=typing_intervals,
        backspace_count=backspace_count,
        avg_key_pressure=avg_key_pressure,
        mouse_jitter=mouse_jitter,
        mouse_path_entropy=mouse_path_entropy,
        device_fingerprint=device_fingerprint,
        ip_info=ip_info,
        geo_distance_km=geo_distance_km,
        time_of_day=time_of_day,
        velocity_attempts_last_hour=velocity_attempts_last_hour,
        label=1 if is_fraud else 0
    )


def generate_synthetic_dataset(n_samples: int = 10000, fraud_ratio: float = 0.3) -> 
List[EventLog]:
    """
    Generate a synthetic dataset of event logs.
    
    Args:
        n_samples: Total number of samples to generate
        fraud_ratio: Proportion of fraudulent samples (0.0 to 1.0)
        
    Returns:
        List of EventLog objects
    """
    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud
    
    print(f"Generating {n_samples} samples ({n_legit} legitimate, {n_fraud} fraudulent)...")
    
    events = []
    
    # Generate legitimate events
    for i in range(n_legit):
        if i % 1000 == 0:
            print(f"  Generated {i}/{n_legit} legitimate events...")
        events.append(generate_synthetic_event(is_fraud=False))
    
    # Generate fraudulent events
    for i in range(n_fraud):
        if i % 1000 == 0:
            print(f"  Generated {i}/{n_fraud} fraudulent events...")
        events.append(generate_synthetic_event(is_fraud=True))
    
    # Shuffle the dataset
    random.shuffle(events)
    
    print(f"Dataset generation complete: {len(events)} events")
    return events


def events_to_dict_list(events: List[EventLog]) -> List[Dict]:
    """
    Convert list of EventLog objects to list of dictionaries.
    
    Args:
        events: List of EventLog objects
        
    Returns:
        List of dictionaries
    """
    return [event.dict() for event in events]
