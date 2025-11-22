"""
Utility functions and data models for fraud detection.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
import numpy as np
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level enumeration."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class DeviceFingerprint(BaseModel):
    """Device fingerprint information."""
    browser: str = Field(..., description="Browser name and version")
    os: str = Field(..., description="Operating system")
    timezone: str = Field(..., description="Timezone identifier")
    screen_res: str = Field(..., description="Screen resolution")


class IPInfo(BaseModel):
    """IP address information."""
    country: str = Field(..., description="Country code")
    asn: int = Field(..., description="Autonomous System Number")
    is_vpn: bool = Field(..., description="Whether IP is from VPN/proxy")


class EventLog(BaseModel):
    """Event log for a credit card entry attempt."""
    typing_intervals: List[float] = Field(..., description="Milliseconds between keystrokes")
    backspace_count: int = Field(..., ge=0, description="Number of backspaces used")
    avg_key_pressure: float = Field(..., ge=0.0, le=1.0, description="Average key pressure 
(simulated)")
    mouse_jitter: float = Field(..., ge=0.0, description="Mouse movement jitter score")
    mouse_path_entropy: float = Field(..., ge=0.0, description="Entropy of mouse path")
    device_fingerprint: DeviceFingerprint
    ip_info: IPInfo
    geo_distance_km: float = Field(..., ge=0.0, description="Distance from expected location")
    time_of_day: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    velocity_attempts_last_hour: int = Field(..., ge=0, description="Attempts in last hour")
    label: Optional[int] = Field(None, ge=0, le=1, description="0=legit, 1=fraud")

    @validator('typing_intervals')
    def validate_typing_intervals(cls, v):
        if len(v) == 0:
            raise ValueError("typing_intervals cannot be empty")
        if any(x < 0 for x in v):
            raise ValueError("typing_intervals must be non-negative")
        return v


class RiskScore(BaseModel):
    """Risk score output."""
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk probability")
    risk_level: RiskLevel = Field(..., description="Risk level category")
    explanations: List[Dict[str, Any]] = Field(..., description="Feature importance 
explanations")


def calculate_risk_level(risk_score: float) -> RiskLevel:
    """
    Convert a risk score to a risk level.
    
    Args:
        risk_score: Risk probability between 0.0 and 1.0
        
    Returns:
        RiskLevel enum value
    """
    if risk_score < 0.3:
        return RiskLevel.LOW
    elif risk_score < 0.7:
        return RiskLevel.MEDIUM
    else:
        return RiskLevel.HIGH


def normalize_feature(value: float, min_val: float, max_val: float) -> float:
    """
    Normalize a feature value to [0, 1] range.
    
    Args:
        value: Value to normalize
        min_val: Minimum value in range
        max_val: Maximum value in range
        
    Returns:
        Normalized value
    """
    if max_val == min_val:
        return 0.5
    return np.clip((value - min_val) / (max_val - min_val), 0.0, 1.0)


def calculate_entropy(values: List[float]) -> float:
    """
    Calculate entropy of a list of values.
    
    Args:
        values: List of numerical values
        
    Returns:
        Entropy score
    """
    if not values:
        return 0.0
    
    # Bin the values
    hist, _ = np.histogram(values, bins=10)
    hist = hist[hist > 0]
    
    # Calculate probabilities
    probs = hist / hist.sum()
    
    # Calculate entropy
    entropy = -np.sum(probs * np.log2(probs))
    return float(entropy)


def calculate_coefficient_of_variation(values: List[float]) -> float:
    """
    Calculate coefficient of variation (CV = std/mean).
    
    Args:
        values: List of numerical values
        
    Returns:
        Coefficient of variation
    """
    if not values or len(values) < 2:
        return 0.0
    
    arr = np.array(values)
    mean = np.mean(arr)
    
    if mean == 0:
        return 0.0
    
    std = np.std(arr)
    return float(std / mean)
