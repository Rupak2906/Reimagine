from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class KeystrokeData(BaseModel):
    dwell_time_mean_ms: float = Field(..., ge=0, description="Average key hold duration")
    dwell_time_std_ms: float = Field(..., ge=0, description="Std dev of key hold duration")
    flight_time_mean_ms: float = Field(..., ge=0, description="Average time between keys")
    typing_speed_cpm: float = Field(..., ge=0, description="Characters per minute")


class MouseData(BaseModel):
    avg_velocity_px_ms: float = Field(..., ge=0, description="Average mouse speed")
    path_curvature_ratio: float = Field(..., ge=1.0, description="Actual path / straight line")
    click_precision_px: float = Field(..., ge=0, description="Distance from target center")
    micro_corrections_per_movement: float = Field(..., ge=0, description="Small direction changes")
    total_distance_px: float = Field(..., ge=0, description="Total mouse travel")


class DeviceData(BaseModel):
    fingerprint_hash: str = Field(..., min_length=16, max_length=64)


class NetworkData(BaseModel):
    ip_address: str
    is_datacenter: bool = Field(..., description="True if IP is from datacenter/VPN")
    country_code: str = Field(..., min_length=2, max_length=2)


class InteractionData(BaseModel):
    form_completion_time_ms: float = Field(..., ge=0)
    time_to_first_interaction_ms: float = Field(..., ge=0)
    idle_time_percentage: float = Field(..., ge=0, le=100)


class MetadataData(BaseModel):
    user_agent: str
    screen_resolution: str


class LoginAttemptRequest(BaseModel):
    session_id: str
    user_id: str
    timestamp: datetime
    event_type: str = "login_attempt"
    keystroke: KeystrokeData
    mouse: MouseData
    device: DeviceData
    network: NetworkData
    interaction: InteractionData
    metadata: MetadataData


class RiskAssessmentResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    action: str
    flags: List[str]
    session_token: Optional[str] = None


class UserBaseline(BaseModel):
    user_id: str
    created_at: datetime
    updated_at: datetime
    session_count: int
    keystroke_dwell_mean: float
    keystroke_dwell_std: float
    keystroke_flight_mean: float
    keystroke_flight_std: float
    typing_speed_mean: float
    typing_speed_std: float
    mouse_velocity_mean: float
    mouse_velocity_std: float
    curvature_mean: float
    curvature_std: float
    click_precision_mean: float
    click_precision_std: float
    micro_corrections_mean: float
    micro_corrections_std: float
    known_fingerprints: List[str]
    known_countries: List[str]
    typical_form_time_mean: float
    typical_form_time_std: float