import numpy as np
import pickle
from pathlib import Path
from typing import Tuple, List, Optional, Dict
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from schemas import LoginAttemptRequest, UserBaseline, RiskLevel


class ImprovedRiskModel:
    """
    ML model for login risk assessment with impersonation detection.
    
    Key difference from basic model: compares incoming attempt against
    user's stored behavioral baseline to detect when someone other than
    the account owner is logging in, even with correct credentials.
    
    Labels:
    - 0: Legitimate (account owner)
    - 1: Impersonation (different human with credentials)
    - 2: Bot/Automation
    
    Risk levels:
    - LOW (0-30): Allow normal flow
    - MEDIUM (31-70): Trigger step-up auth
    - HIGH (71-100): Block
    """
    
    RISK_THRESHOLDS = {"low_max": 30, "medium_max": 70}
    
    # Human behavior bounds
    BOT_TYPING_SPEED_THRESHOLD = 800
    BOT_DWELL_MIN = 30
    BOT_DWELL_STD_MIN = 5
    BOT_VELOCITY_MAX = 5.0
    BOT_CURVATURE_MIN = 1.05
    BOT_PRECISION_MIN = 2.0
    BOT_CORRECTIONS_MIN = 0.5
    BOT_FORM_TIME_MIN = 1000
    BOT_IDLE_MIN = 1.0
    
    def __init__(self, model_path: Optional[str] = None):
        self.scaler = StandardScaler()
        self.model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            min_samples_split=10,
            min_samples_leaf=5,
            subsample=0.8,
            random_state=42
        )
        self.is_trained = False
        self.feature_names = self._get_feature_names()
        
        if model_path and Path(model_path).exists():
            self.load(model_path)
    
    def _get_feature_names(self) -> List[str]:
        return [
            # Raw features (12)
            "raw_dwell_mean", "raw_dwell_std", "raw_flight_mean", "raw_typing_speed",
            "raw_mouse_velocity", "raw_curvature", "raw_click_precision",
            "raw_micro_corrections", "raw_total_distance",
            "raw_form_time", "raw_first_interaction", "raw_idle_pct",
            # Deviation features (8)
            "dev_dwell", "dev_flight", "dev_typing_speed",
            "dev_velocity", "dev_curvature", "dev_precision",
            "dev_micro_corrections", "dev_form_time",
            # Bot signals (9)
            "bot_fast_typing", "bot_short_dwell", "bot_consistent_dwell",
            "bot_fast_mouse", "bot_straight_path", "bot_precise_click",
            "bot_no_corrections", "bot_instant_form", "bot_no_idle",
            # Context signals (3)
            "ctx_datacenter", "ctx_new_country", "ctx_expected_vpn",
        ]
    
    def _z_score(self, value: float, mean: float, std: float) -> float:
        """Calculate capped z-score."""
        if std < 0.001:
            return 0.0 if abs(value - mean) < 0.001 else 5.0
        return min(abs((value - mean) / std), 5.0)
    
    def extract_features(
        self,
        request: LoginAttemptRequest,
        baseline: Optional[UserBaseline]
    ) -> np.ndarray:
        """Extract feature vector from request and baseline."""
        
        k = request.keystroke
        m = request.mouse
        i = request.interaction
        n = request.network
        
        # Raw features (12)
        raw = [
            k.dwell_time_mean_ms,
            k.dwell_time_std_ms,
            k.flight_time_mean_ms,
            k.typing_speed_cpm,
            m.avg_velocity_px_ms,
            m.path_curvature_ratio,
            m.click_precision_px,
            m.micro_corrections_per_movement,
            m.total_distance_px,
            i.form_completion_time_ms,
            i.time_to_first_interaction_ms,
            i.idle_time_percentage,
        ]
        
        # Deviation features (8) - critical for impersonation detection
        if baseline:
            deviations = [
                self._z_score(k.dwell_time_mean_ms, baseline.keystroke_dwell_mean, baseline.keystroke_dwell_std),
                self._z_score(k.flight_time_mean_ms, baseline.keystroke_flight_mean, baseline.keystroke_flight_std),
                self._z_score(k.typing_speed_cpm, baseline.typing_speed_mean, baseline.typing_speed_std),
                self._z_score(m.avg_velocity_px_ms, baseline.mouse_velocity_mean, baseline.mouse_velocity_std),
                self._z_score(m.path_curvature_ratio, baseline.curvature_mean, baseline.curvature_std),
                self._z_score(m.click_precision_px, baseline.click_precision_mean, baseline.click_precision_std),
                self._z_score(m.micro_corrections_per_movement, baseline.micro_corrections_mean, baseline.micro_corrections_std),
                self._z_score(i.form_completion_time_ms, baseline.typical_form_time_mean, baseline.typical_form_time_std),
            ]
        else:
            # No baseline - can't compute deviations, use zeros
            deviations = [0.0] * 8
        
        # Bot signals (9)
        bot_signals = [
            float(k.typing_speed_cpm > self.BOT_TYPING_SPEED_THRESHOLD),
            float(k.dwell_time_mean_ms < self.BOT_DWELL_MIN),
            float(k.dwell_time_std_ms < self.BOT_DWELL_STD_MIN),
            float(m.avg_velocity_px_ms > self.BOT_VELOCITY_MAX),
            float(m.path_curvature_ratio < self.BOT_CURVATURE_MIN),
            float(m.click_precision_px < self.BOT_PRECISION_MIN),
            float(m.micro_corrections_per_movement < self.BOT_CORRECTIONS_MIN),
            float(i.form_completion_time_ms < self.BOT_FORM_TIME_MIN),
            float(i.idle_time_percentage < self.BOT_IDLE_MIN),
        ]
        
        # Context signals (3)
        if baseline:
            new_country = n.country_code not in baseline.known_countries
            # Check if user typically uses VPN (would have datacenter IPs in history)
            expected_vpn = False  # Could be enhanced with baseline tracking
        else:
            new_country = False
            expected_vpn = False
        
        context = [
            float(n.is_datacenter),
            float(new_country),
            float(expected_vpn and n.is_datacenter),
        ]
        
        return np.array(raw + deviations + bot_signals + context)
    
    def _calculate_risk_score(self, probabilities: np.ndarray) -> int:
        """Convert model probabilities to 0-100 risk score."""
        # [prob_legitimate, prob_impersonation, prob_bot]
        # Legitimate -> 0, Impersonation -> 60, Bot -> 90
        weights = np.array([0, 60, 90])
        score = np.dot(probabilities, weights)
        return int(np.clip(score, 0, 100))
    
    def _determine_risk_level(self, score: int) -> RiskLevel:
        if score <= self.RISK_THRESHOLDS["low_max"]:
            return RiskLevel.LOW
        elif score <= self.RISK_THRESHOLDS["medium_max"]:
            return RiskLevel.MEDIUM
        return RiskLevel.HIGH
    
    def _determine_action(self, risk_level: RiskLevel) -> str:
        return {
            RiskLevel.LOW: "allow",
            RiskLevel.MEDIUM: "step_up_auth",
            RiskLevel.HIGH: "block",
        }[risk_level]
    
    def _identify_flags(
        self,
        request: LoginAttemptRequest,
        baseline: Optional[UserBaseline],
        prediction: int,
        probabilities: np.ndarray
    ) -> List[str]:
        """Identify specific risk flags."""
        flags = []
        
        k = request.keystroke
        m = request.mouse
        i = request.interaction
        
        # Prediction-based flags
        if prediction == 1:
            flags.append("possible_impersonation")
        elif prediction == 2:
            flags.append("likely_bot")
        
        # Confidence flags
        if probabilities[1] > 0.4:  # Impersonation probability
            flags.append("behavioral_mismatch")
        if probabilities[2] > 0.5:  # Bot probability
            flags.append("automation_detected")
        
        # Bot signal flags
        if k.typing_speed_cpm > self.BOT_TYPING_SPEED_THRESHOLD:
            flags.append("inhuman_typing_speed")
        if k.dwell_time_std_ms < self.BOT_DWELL_STD_MIN:
            flags.append("robotic_typing_consistency")
        if m.path_curvature_ratio < self.BOT_CURVATURE_MIN:
            flags.append("robotic_mouse_movement")
        if m.click_precision_px < self.BOT_PRECISION_MIN:
            flags.append("inhuman_click_precision")
        if i.form_completion_time_ms < self.BOT_FORM_TIME_MIN:
            flags.append("instant_form_completion")
        
        # Context flags
        if request.network.is_datacenter:
            flags.append("datacenter_ip")
        
        if baseline:
            if request.device.fingerprint_hash not in baseline.known_fingerprints:
                flags.append("new_device")
            if request.network.country_code not in baseline.known_countries:
                flags.append("new_location")
            
            # High deviation flags
            if self._z_score(k.typing_speed_cpm, baseline.typing_speed_mean, baseline.typing_speed_std) > 2.5:
                flags.append("typing_pattern_deviation")
            if self._z_score(m.avg_velocity_px_ms, baseline.mouse_velocity_mean, baseline.mouse_velocity_std) > 2.5:
                flags.append("mouse_pattern_deviation")
        else:
            flags.append("no_baseline")
        
        return list(set(flags))  # Dedupe
    
    def predict(
        self,
        request: LoginAttemptRequest,
        baseline: Optional[UserBaseline] = None
    ) -> Tuple[int, RiskLevel, str, List[str]]:
        """
        Predict risk for a login attempt.
        
        Returns:
            (risk_score, risk_level, action, flags)
        """
        features = self.extract_features(request, baseline)
        
        if self.is_trained:
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            probabilities = self.model.predict_proba(features_scaled)[0]
            prediction = self.model.predict(features_scaled)[0]
            risk_score = self._calculate_risk_score(probabilities)
        else:
            # Fallback rule-based
            risk_score, prediction, probabilities = self._rule_based_score(request, baseline)
        
        risk_level = self._determine_risk_level(risk_score)
        action = self._determine_action(risk_level)
        flags = self._identify_flags(request, baseline, prediction, probabilities)
        
        return risk_score, risk_level, action, flags
    
    def _rule_based_score(
        self,
        request: LoginAttemptRequest,
        baseline: Optional[UserBaseline]
    ) -> Tuple[int, int, np.ndarray]:
        """Fallback rule-based scoring."""
        score = 0
        
        k = request.keystroke
        m = request.mouse
        i = request.interaction
        
        # Bot signals (max 50)
        bot_count = sum([
            k.typing_speed_cpm > self.BOT_TYPING_SPEED_THRESHOLD,
            k.dwell_time_mean_ms < self.BOT_DWELL_MIN,
            k.dwell_time_std_ms < self.BOT_DWELL_STD_MIN,
            m.avg_velocity_px_ms > self.BOT_VELOCITY_MAX,
            m.path_curvature_ratio < self.BOT_CURVATURE_MIN,
            m.click_precision_px < self.BOT_PRECISION_MIN,
            i.form_completion_time_ms < self.BOT_FORM_TIME_MIN,
        ])
        
        if bot_count >= 4:
            return 85, 2, np.array([0.05, 0.1, 0.85])
        
        score += bot_count * 8
        
        # Context (max 20)
        if request.network.is_datacenter:
            score += 10
        
        # Baseline deviation (max 30)
        if baseline:
            if request.device.fingerprint_hash not in baseline.known_fingerprints:
                score += 8
            if request.network.country_code not in baseline.known_countries:
                score += 12
            
            # Behavioral deviations
            deviations = [
                self._z_score(k.dwell_time_mean_ms, baseline.keystroke_dwell_mean, baseline.keystroke_dwell_std),
                self._z_score(k.typing_speed_cpm, baseline.typing_speed_mean, baseline.typing_speed_std),
                self._z_score(m.avg_velocity_px_ms, baseline.mouse_velocity_mean, baseline.mouse_velocity_std),
            ]
            high_dev_count = sum(1 for d in deviations if d > 2.0)
            
            if high_dev_count >= 2:
                score += 20
                prediction = 1  # Likely impersonation
            else:
                prediction = 0
        else:
            prediction = 0
        
        score = min(score, 100)
        
        # Approximate probabilities
        if prediction == 1:
            probs = np.array([0.3, 0.6, 0.1])
        elif bot_count >= 2:
            probs = np.array([0.2, 0.2, 0.6])
        else:
            probs = np.array([0.8, 0.15, 0.05])
        
        return score, prediction, probs
    
    def train(self, X: np.ndarray, y: np.ndarray, test_size: float = 0.2) -> Dict:
        """Train the model."""
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        y_pred = self.model.predict(X_test_scaled)
        
        # Feature importance analysis
        importances = dict(zip(self.feature_names, self.model.feature_importances_))
        
        return {
            "classification_report": classification_report(
                y_test, y_pred,
                target_names=["legitimate", "impersonation", "bot"]
            ),
            "confusion_matrix": confusion_matrix(y_test, y_pred),
            "feature_importances": importances,
            "train_size": len(X_train),
            "test_size": len(X_test),
        }
    
    def save(self, path: str):
        with open(path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "scaler": self.scaler,
                "is_trained": self.is_trained,
            }, f)
    
    def load(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.scaler = data["scaler"]
        self.is_trained = data["is_trained"]