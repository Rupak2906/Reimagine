import numpy as np
from typing import Dict, Optional
from schemas import LoginAttemptRequest, UserBaseline


class FeatureExtractor:
    """Extracts ML-ready features from login attempt data."""
    
    # Human behavior bounds (for bot detection)
    HUMAN_TYPING_SPEED_MAX = 800  # CPM - above this is likely bot
    HUMAN_DWELL_MIN = 30  # ms - below this is suspicious
    HUMAN_VELOCITY_MAX = 5.0  # px/ms - above this is suspicious
    HUMAN_CURVATURE_MIN = 1.05  # below this suggests robotic straight lines
    HUMAN_CLICK_PRECISION_MIN = 2.0  # px - below this is too precise
    
    def __init__(self):
        pass
    
    def extract_raw_features(self, request: LoginAttemptRequest) -> np.ndarray:
        """Extract raw feature vector from login attempt (no baseline comparison)."""
        features = [
            request.keystroke.dwell_time_mean_ms,
            request.keystroke.dwell_time_std_ms,
            request.keystroke.flight_time_mean_ms,
            request.keystroke.typing_speed_cpm,
            request.mouse.avg_velocity_px_ms,
            request.mouse.path_curvature_ratio,
            request.mouse.click_precision_px,
            request.mouse.micro_corrections_per_movement,
            request.mouse.total_distance_px,
            float(request.network.is_datacenter),
            request.interaction.form_completion_time_ms,
            request.interaction.time_to_first_interaction_ms,
            request.interaction.idle_time_percentage,
        ]
        return np.array(features)
    
    def extract_deviation_features(
        self, 
        request: LoginAttemptRequest, 
        baseline: UserBaseline
    ) -> Dict[str, float]:
        """Calculate z-score deviations from user baseline."""
        
        def z_score(value: float, mean: float, std: float) -> float:
            if std == 0:
                return 0.0 if value == mean else 3.0  # Cap at 3 if no variance
            return min(abs((value - mean) / std), 5.0)  # Cap at 5
        
        deviations = {
            "keystroke_dwell_deviation": z_score(
                request.keystroke.dwell_time_mean_ms,
                baseline.keystroke_dwell_mean,
                baseline.keystroke_dwell_std
            ),
            "keystroke_flight_deviation": z_score(
                request.keystroke.flight_time_mean_ms,
                baseline.keystroke_flight_mean,
                baseline.keystroke_flight_std
            ),
            "typing_speed_deviation": z_score(
                request.keystroke.typing_speed_cpm,
                baseline.typing_speed_mean,
                baseline.typing_speed_std
            ),
            "mouse_velocity_deviation": z_score(
                request.mouse.avg_velocity_px_ms,
                baseline.mouse_velocity_mean,
                baseline.mouse_velocity_std
            ),
            "curvature_deviation": z_score(
                request.mouse.path_curvature_ratio,
                baseline.curvature_mean,
                baseline.curvature_std
            ),
            "click_precision_deviation": z_score(
                request.mouse.click_precision_px,
                baseline.click_precision_mean,
                baseline.click_precision_std
            ),
            "form_time_deviation": z_score(
                request.interaction.form_completion_time_ms,
                baseline.typical_form_time_mean,
                baseline.typical_form_time_std
            ),
        }
        return deviations
    
    def extract_bot_signals(self, request: LoginAttemptRequest) -> Dict[str, float]:
        """Extract signals that indicate bot behavior."""
        signals = {
            # Typing too fast
            "excessive_typing_speed": float(
                request.keystroke.typing_speed_cpm > self.HUMAN_TYPING_SPEED_MAX
            ),
            # Keys held too briefly
            "inhuman_dwell_time": float(
                request.keystroke.dwell_time_mean_ms < self.HUMAN_DWELL_MIN
            ),
            # No variation in typing rhythm (bots are too consistent)
            "no_typing_variance": float(
                request.keystroke.dwell_time_std_ms < 5.0
            ),
            # Mouse moving too fast
            "excessive_mouse_speed": float(
                request.mouse.avg_velocity_px_ms > self.HUMAN_VELOCITY_MAX
            ),
            # Mouse paths too straight
            "robotic_mouse_path": float(
                request.mouse.path_curvature_ratio < self.HUMAN_CURVATURE_MIN
            ),
            # Clicks too precise
            "inhuman_click_precision": float(
                request.mouse.click_precision_px < self.HUMAN_CLICK_PRECISION_MIN
            ),
            # No micro-corrections (humans always have these)
            "no_micro_corrections": float(
                request.mouse.micro_corrections_per_movement < 0.5
            ),
            # Form completed impossibly fast
            "instant_form_completion": float(
                request.interaction.form_completion_time_ms < 1000
            ),
            # No idle time at all
            "no_idle_time": float(
                request.interaction.idle_time_percentage < 1.0
            ),
            # Datacenter IP
            "datacenter_ip": float(request.network.is_datacenter),
        }
        return signals
    
    def extract_context_signals(
        self, 
        request: LoginAttemptRequest, 
        baseline: Optional[UserBaseline]
    ) -> Dict[str, float]:
        """Extract contextual risk signals."""
        signals = {
            "is_datacenter": float(request.network.is_datacenter),
        }
        
        if baseline:
            # Device recognition
            signals["unknown_device"] = float(
                request.device.fingerprint_hash not in baseline.known_fingerprints
            )
            # Location recognition
            signals["unknown_country"] = float(
                request.network.country_code not in baseline.known_countries
            )
        else:
            # No baseline - first time user, can't compare
            signals["unknown_device"] = 0.0
            signals["unknown_country"] = 0.0
            signals["no_baseline"] = 1.0
        
        return signals
    
    def build_feature_vector(
        self, 
        request: LoginAttemptRequest, 
        baseline: Optional[UserBaseline] = None
    ) -> np.ndarray:
        """Build complete feature vector for ML model."""
        
        # Raw behavioral features (13 features)
        raw = self.extract_raw_features(request)
        
        # Bot detection signals (10 features)
        bot_signals = self.extract_bot_signals(request)
        bot_array = np.array(list(bot_signals.values()))
        
        # Context signals (3-4 features)
        context_signals = self.extract_context_signals(request, baseline)
        context_array = np.array(list(context_signals.values()))
        
        # Deviation features if baseline exists (7 features)
        if baseline:
            deviation_signals = self.extract_deviation_features(request, baseline)
            deviation_array = np.array(list(deviation_signals.values()))
        else:
            deviation_array = np.zeros(7)
        
        # Concatenate all features
        return np.concatenate([raw, bot_array, context_array, deviation_array])
    
    def get_feature_names(self, has_baseline: bool = True) -> list:
        """Return feature names for interpretability."""
        names = [
            # Raw features
            "dwell_time_mean", "dwell_time_std", "flight_time_mean", "typing_speed",
            "mouse_velocity", "path_curvature", "click_precision", "micro_corrections",
            "total_distance", "is_datacenter_raw", "form_time", "first_interaction_time",
            "idle_percentage",
            # Bot signals
            "excessive_typing_speed", "inhuman_dwell_time", "no_typing_variance",
            "excessive_mouse_speed", "robotic_mouse_path", "inhuman_click_precision",
            "no_micro_corrections", "instant_form_completion", "no_idle_time", "datacenter_ip",
            # Context signals
            "is_datacenter", "unknown_device", "unknown_country",
        ]
        
        if has_baseline:
            names.append("no_baseline")
        
        # Deviation features
        names.extend([
            "keystroke_dwell_deviation", "keystroke_flight_deviation", 
            "typing_speed_deviation", "mouse_velocity_deviation",
            "curvature_deviation", "click_precision_deviation", "form_time_deviation"
        ])
        
        return names