import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
import numpy as np
from schemas import LoginAttemptRequest, UserBaseline


class BaselineManager:
    """
    Manages user behavioral baselines.
    
    Handles:
    - Creating new baselines during enrollment
    - Updating baselines with new sessions
    - Retrieving baselines for comparison
    """
    
    MIN_SESSIONS_FOR_RELIABLE_BASELINE = 3
    BASELINE_UPDATE_WEIGHT = 0.2  # Weight for exponential moving average
    
    def __init__(self, storage_path: str = "./baselines"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
    
    def _get_baseline_path(self, user_id: str) -> Path:
        """Get file path for user's baseline."""
        return self.storage_path / f"{user_id}.json"
    
    def get_baseline(self, user_id: str) -> Optional[UserBaseline]:
        """Retrieve user's baseline if it exists."""
        path = self._get_baseline_path(user_id)
        if not path.exists():
            return None
        
        with open(path, "r") as f:
            data = json.load(f)
        
        return UserBaseline(
            user_id=data["user_id"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            session_count=data["session_count"],
            keystroke_dwell_mean=data["keystroke_dwell_mean"],
            keystroke_dwell_std=data["keystroke_dwell_std"],
            keystroke_flight_mean=data["keystroke_flight_mean"],
            keystroke_flight_std=data["keystroke_flight_std"],
            typing_speed_mean=data["typing_speed_mean"],
            typing_speed_std=data["typing_speed_std"],
            mouse_velocity_mean=data["mouse_velocity_mean"],
            mouse_velocity_std=data["mouse_velocity_std"],
            curvature_mean=data["curvature_mean"],
            curvature_std=data["curvature_std"],
            click_precision_mean=data["click_precision_mean"],
            click_precision_std=data["click_precision_std"],
            micro_corrections_mean=data.get("micro_corrections_mean", 3.0),
            micro_corrections_std=data.get("micro_corrections_std", 1.0),
            known_fingerprints=data["known_fingerprints"],
            known_countries=data["known_countries"],
            typical_form_time_mean=data["typical_form_time_mean"],
            typical_form_time_std=data["typical_form_time_std"],
        )
    
    def _save_baseline(self, baseline: UserBaseline):
        """Save baseline to storage."""
        path = self._get_baseline_path(baseline.user_id)
        data = {
            "user_id": baseline.user_id,
            "created_at": baseline.created_at.isoformat(),
            "updated_at": baseline.updated_at.isoformat(),
            "session_count": baseline.session_count,
            "keystroke_dwell_mean": baseline.keystroke_dwell_mean,
            "keystroke_dwell_std": baseline.keystroke_dwell_std,
            "keystroke_flight_mean": baseline.keystroke_flight_mean,
            "keystroke_flight_std": baseline.keystroke_flight_std,
            "typing_speed_mean": baseline.typing_speed_mean,
            "typing_speed_std": baseline.typing_speed_std,
            "mouse_velocity_mean": baseline.mouse_velocity_mean,
            "mouse_velocity_std": baseline.mouse_velocity_std,
            "curvature_mean": baseline.curvature_mean,
            "curvature_std": baseline.curvature_std,
            "click_precision_mean": baseline.click_precision_mean,
            "click_precision_std": baseline.click_precision_std,
            "micro_corrections_mean": baseline.micro_corrections_mean,
            "micro_corrections_std": baseline.micro_corrections_std,
            "known_fingerprints": baseline.known_fingerprints,
            "known_countries": baseline.known_countries,
            "typical_form_time_mean": baseline.typical_form_time_mean,
            "typical_form_time_std": baseline.typical_form_time_std,
        }
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
    
    def create_baseline(self, user_id: str, request: LoginAttemptRequest) -> UserBaseline:
        """Create initial baseline from first session."""
        now = datetime.utcnow()
        baseline = UserBaseline(
            user_id=user_id,
            created_at=now,
            updated_at=now,
            session_count=1,
            keystroke_dwell_mean=request.keystroke.dwell_time_mean_ms,
            keystroke_dwell_std=request.keystroke.dwell_time_std_ms,
            keystroke_flight_mean=request.keystroke.flight_time_mean_ms,
            keystroke_flight_std=20.0,  # Initial estimate
            typing_speed_mean=request.keystroke.typing_speed_cpm,
            typing_speed_std=50.0,  # Initial estimate
            mouse_velocity_mean=request.mouse.avg_velocity_px_ms,
            mouse_velocity_std=0.3,  # Initial estimate
            curvature_mean=request.mouse.path_curvature_ratio,
            curvature_std=0.1,  # Initial estimate
            click_precision_mean=request.mouse.click_precision_px,
            click_precision_std=3.0,  # Initial estimate
            micro_corrections_mean=request.mouse.micro_corrections_per_movement,
            micro_corrections_std=1.0,  # Initial estimate
            known_fingerprints=[request.device.fingerprint_hash],
            known_countries=[request.network.country_code],
            typical_form_time_mean=request.interaction.form_completion_time_ms,
            typical_form_time_std=2000.0,  # Initial estimate
        )
        self._save_baseline(baseline)
        return baseline
    
    def update_baseline(
        self, 
        user_id: str, 
        request: LoginAttemptRequest,
        verified: bool = True
    ) -> UserBaseline:
        """
        Update baseline with new session data.
        
        Uses exponential moving average to weight recent sessions more heavily
        while maintaining historical patterns.
        
        Args:
            user_id: User identifier
            request: Current login attempt data
            verified: Whether this session was verified (passed auth)
        """
        baseline = self.get_baseline(user_id)
        
        if baseline is None:
            return self.create_baseline(user_id, request)
        
        if not verified:
            # Don't update baseline with unverified sessions
            return baseline
        
        w = self.BASELINE_UPDATE_WEIGHT
        
        def ema(old_val: float, new_val: float) -> float:
            return (1 - w) * old_val + w * new_val
        
        def update_std(old_mean: float, old_std: float, new_val: float) -> float:
            # Approximate running std update
            deviation = abs(new_val - old_mean)
            return ema(old_std, deviation)
        
        # Update keystroke metrics
        new_dwell_std = update_std(
            baseline.keystroke_dwell_mean,
            baseline.keystroke_dwell_std,
            request.keystroke.dwell_time_mean_ms
        )
        baseline.keystroke_dwell_mean = ema(
            baseline.keystroke_dwell_mean, 
            request.keystroke.dwell_time_mean_ms
        )
        baseline.keystroke_dwell_std = new_dwell_std
        
        baseline.keystroke_flight_mean = ema(
            baseline.keystroke_flight_mean,
            request.keystroke.flight_time_mean_ms
        )
        
        new_typing_std = update_std(
            baseline.typing_speed_mean,
            baseline.typing_speed_std,
            request.keystroke.typing_speed_cpm
        )
        baseline.typing_speed_mean = ema(
            baseline.typing_speed_mean,
            request.keystroke.typing_speed_cpm
        )
        baseline.typing_speed_std = new_typing_std
        
        # Update mouse metrics
        new_velocity_std = update_std(
            baseline.mouse_velocity_mean,
            baseline.mouse_velocity_std,
            request.mouse.avg_velocity_px_ms
        )
        baseline.mouse_velocity_mean = ema(
            baseline.mouse_velocity_mean,
            request.mouse.avg_velocity_px_ms
        )
        baseline.mouse_velocity_std = new_velocity_std
        
        baseline.curvature_mean = ema(
            baseline.curvature_mean,
            request.mouse.path_curvature_ratio
        )
        
        baseline.click_precision_mean = ema(
            baseline.click_precision_mean,
            request.mouse.click_precision_px
        )
        
        # Update form timing
        baseline.typical_form_time_mean = ema(
            baseline.typical_form_time_mean,
            request.interaction.form_completion_time_ms
        )
        
        # Add new device/country if not known
        if request.device.fingerprint_hash not in baseline.known_fingerprints:
            baseline.known_fingerprints.append(request.device.fingerprint_hash)
            # Keep only last 10 devices
            if len(baseline.known_fingerprints) > 10:
                baseline.known_fingerprints = baseline.known_fingerprints[-10:]
        
        if request.network.country_code not in baseline.known_countries:
            baseline.known_countries.append(request.network.country_code)
            # Keep only last 20 countries
            if len(baseline.known_countries) > 20:
                baseline.known_countries = baseline.known_countries[-20:]
        
        # Update metadata
        baseline.session_count += 1
        baseline.updated_at = datetime.utcnow()
        
        self._save_baseline(baseline)
        return baseline
    
    def is_baseline_reliable(self, user_id: str) -> bool:
        """Check if baseline has enough sessions to be reliable."""
        baseline = self.get_baseline(user_id)
        if baseline is None:
            return False
        return baseline.session_count >= self.MIN_SESSIONS_FOR_RELIABLE_BASELINE
    
    def delete_baseline(self, user_id: str) -> bool:
        """Delete user's baseline (e.g., on account deletion)."""
        path = self._get_baseline_path(user_id)
        if path.exists():
            path.unlink()
            return True
        return False