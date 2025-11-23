import numpy as np
import json
from datetime import datetime
from typing import List, Tuple, Dict


class UserProfileGenerator:
    """
    Generates synthetic user behavioral profiles.
    Each profile represents a unique person's typing and mouse patterns.
    """
    
    def __init__(self, seed: int = None):
        if seed:
            np.random.seed(seed)
    
    def generate_profile(self) -> Dict:
        """Generate a unique user behavioral profile."""
        
        # Each person has their own central tendencies
        profile = {
            # Keystroke characteristics
            "dwell_time_mean": np.random.uniform(60, 130),
            "dwell_time_std": np.random.uniform(15, 40),
            "flight_time_mean": np.random.uniform(80, 180),
            "flight_time_std": np.random.uniform(20, 50),
            "typing_speed": np.random.uniform(200, 500),
            "typing_speed_std": np.random.uniform(30, 80),
            
            # Mouse characteristics
            "mouse_velocity": np.random.uniform(0.6, 2.0),
            "mouse_velocity_std": np.random.uniform(0.15, 0.5),
            "curvature": np.random.uniform(1.15, 1.5),
            "curvature_std": np.random.uniform(0.05, 0.2),
            "click_precision": np.random.uniform(5, 18),
            "click_precision_std": np.random.uniform(2, 6),
            "micro_corrections": np.random.uniform(1.5, 5),
            "micro_corrections_std": np.random.uniform(0.5, 1.5),
            
            # Interaction characteristics
            "form_time": np.random.uniform(5000, 15000),
            "form_time_std": np.random.uniform(1000, 4000),
            "first_interaction": np.random.uniform(800, 2500),
            "idle_percentage": np.random.uniform(8, 25),
            
            # Context
            "primary_country": np.random.choice(["US", "GB", "CA", "AU", "DE", "FR", "IN"]),
            "uses_vpn_occasionally": np.random.random() < 0.15,
        }
        
        return profile
    
    def generate_attempt_from_profile(
        self, 
        profile: Dict, 
        variance_multiplier: float = 1.0
    ) -> Dict:
        """
        Generate a login attempt that matches the profile.
        
        Args:
            profile: User's behavioral profile
            variance_multiplier: How much natural variance to add
                                 1.0 = normal day-to-day variance
                                 0.5 = very consistent (same session)
                                 1.5 = tired/distracted/different keyboard
        """
        v = variance_multiplier
        
        attempt = {
            "keystroke": {
                "dwell_time_mean_ms": max(20, np.random.normal(
                    profile["dwell_time_mean"], 
                    profile["dwell_time_std"] * 0.3 * v
                )),
                "dwell_time_std_ms": max(5, np.random.normal(
                    profile["dwell_time_std"],
                    profile["dwell_time_std"] * 0.2 * v
                )),
                "flight_time_mean_ms": max(30, np.random.normal(
                    profile["flight_time_mean"],
                    profile["flight_time_std"] * 0.3 * v
                )),
                "typing_speed_cpm": max(100, np.random.normal(
                    profile["typing_speed"],
                    profile["typing_speed_std"] * v
                )),
            },
            "mouse": {
                "avg_velocity_px_ms": max(0.2, np.random.normal(
                    profile["mouse_velocity"],
                    profile["mouse_velocity_std"] * v
                )),
                "path_curvature_ratio": max(1.02, np.random.normal(
                    profile["curvature"],
                    profile["curvature_std"] * v
                )),
                "click_precision_px": max(1, np.random.normal(
                    profile["click_precision"],
                    profile["click_precision_std"] * v
                )),
                "micro_corrections_per_movement": max(0.3, np.random.normal(
                    profile["micro_corrections"],
                    profile["micro_corrections_std"] * v
                )),
                "total_distance_px": max(500, np.random.normal(4000, 1500 * v)),
            },
            "network": {
                "is_datacenter": profile["uses_vpn_occasionally"] and np.random.random() < 0.3,
                "country_code": profile["primary_country"],
            },
            "interaction": {
                "form_completion_time_ms": max(2000, np.random.normal(
                    profile["form_time"],
                    profile["form_time_std"] * v
                )),
                "time_to_first_interaction_ms": max(200, np.random.normal(
                    profile["first_interaction"],
                    profile["first_interaction"] * 0.3 * v
                )),
                "idle_time_percentage": max(1, np.random.normal(
                    profile["idle_percentage"],
                    profile["idle_percentage"] * 0.3 * v
                )),
            },
        }
        
        return attempt
    
    def generate_different_person_attempt(self, target_profile: Dict) -> Tuple[Dict, Dict]:
        """
        Generate an attempt from a different person (impersonator).
        Returns both the impersonator's profile and their attempt.
        """
        # Create a genuinely different person
        impersonator_profile = self.generate_profile()
        
        # Ensure they're actually different (regenerate if too similar)
        while self._profiles_too_similar(target_profile, impersonator_profile):
            impersonator_profile = self.generate_profile()
        
        # Generate attempt based on impersonator's natural behavior
        attempt = self.generate_attempt_from_profile(impersonator_profile)
        
        # Impersonator might be from different location
        if np.random.random() < 0.6:
            countries = ["US", "GB", "CA", "AU", "DE", "FR", "IN", "RU", "CN", "BR"]
            countries.remove(target_profile["primary_country"]) if target_profile["primary_country"] in countries else None
            attempt["network"]["country_code"] = np.random.choice(countries)
        
        # Impersonator more likely to use VPN/datacenter
        if np.random.random() < 0.4:
            attempt["network"]["is_datacenter"] = True
        
        return impersonator_profile, attempt
    
    def _profiles_too_similar(self, p1: Dict, p2: Dict) -> bool:
        """Check if two profiles are too similar to be distinguishable."""
        dwell_diff = abs(p1["dwell_time_mean"] - p2["dwell_time_mean"])
        flight_diff = abs(p1["flight_time_mean"] - p2["flight_time_mean"])
        speed_diff = abs(p1["typing_speed"] - p2["typing_speed"])
        velocity_diff = abs(p1["mouse_velocity"] - p2["mouse_velocity"])
        
        # If all major metrics are within 15% of each other, too similar
        if (dwell_diff < p1["dwell_time_mean"] * 0.15 and
            flight_diff < p1["flight_time_mean"] * 0.15 and
            speed_diff < p1["typing_speed"] * 0.15 and
            velocity_diff < p1["mouse_velocity"] * 0.15):
            return True
        return False
    
    def generate_bot_attempt(self) -> Dict:
        """Generate a bot/automation attempt."""
        bot_type = np.random.choice(["fast", "slow", "replay"])
        
        if bot_type == "fast":
            return {
                "keystroke": {
                    "dwell_time_mean_ms": np.random.uniform(8, 25),
                    "dwell_time_std_ms": np.random.uniform(0.5, 4),
                    "flight_time_mean_ms": np.random.uniform(15, 40),
                    "typing_speed_cpm": np.random.uniform(900, 2000),
                },
                "mouse": {
                    "avg_velocity_px_ms": np.random.uniform(6, 20),
                    "path_curvature_ratio": np.random.uniform(1.0, 1.03),
                    "click_precision_px": np.random.uniform(0, 1.5),
                    "micro_corrections_per_movement": np.random.uniform(0, 0.2),
                    "total_distance_px": np.random.uniform(300, 1000),
                },
                "network": {
                    "is_datacenter": np.random.random() < 0.85,
                    "country_code": np.random.choice(["US", "RU", "CN", "UA", "RO"]),
                },
                "interaction": {
                    "form_completion_time_ms": np.random.uniform(100, 600),
                    "time_to_first_interaction_ms": np.random.uniform(20, 150),
                    "idle_time_percentage": np.random.uniform(0, 0.5),
                },
            }
        
        elif bot_type == "slow":
            # Bot trying to mimic human timing but fails on consistency
            return {
                "keystroke": {
                    "dwell_time_mean_ms": np.random.uniform(75, 110),
                    "dwell_time_std_ms": np.random.uniform(1, 5),  # Too consistent
                    "flight_time_mean_ms": np.random.uniform(100, 140),
                    "typing_speed_cpm": np.random.uniform(280, 380),
                },
                "mouse": {
                    "avg_velocity_px_ms": np.random.uniform(0.9, 1.6),
                    "path_curvature_ratio": np.random.uniform(1.02, 1.1),  # Too straight
                    "click_precision_px": np.random.uniform(0.5, 3),  # Too precise
                    "micro_corrections_per_movement": np.random.uniform(0.1, 0.6),
                    "total_distance_px": np.random.uniform(2000, 3500),
                },
                "network": {
                    "is_datacenter": np.random.random() < 0.7,
                    "country_code": np.random.choice(["US", "RU", "CN", "UA", "RO"]),
                },
                "interaction": {
                    "form_completion_time_ms": np.random.uniform(5000, 9000),
                    "time_to_first_interaction_ms": np.random.uniform(400, 900),
                    "idle_time_percentage": np.random.uniform(0.3, 2),
                },
            }
        
        else:  # replay - almost perfect but unnaturally consistent across attempts
            base = np.random.uniform(80, 100)
            return {
                "keystroke": {
                    "dwell_time_mean_ms": base + np.random.uniform(-1, 1),
                    "dwell_time_std_ms": np.random.uniform(0.2, 1.5),
                    "flight_time_mean_ms": 115 + np.random.uniform(-2, 2),
                    "typing_speed_cpm": 320 + np.random.uniform(-5, 5),
                },
                "mouse": {
                    "avg_velocity_px_ms": 1.2 + np.random.uniform(-0.02, 0.02),
                    "path_curvature_ratio": 1.28 + np.random.uniform(-0.01, 0.01),
                    "click_precision_px": 9 + np.random.uniform(-0.5, 0.5),
                    "micro_corrections_per_movement": 3 + np.random.uniform(-0.1, 0.1),
                    "total_distance_px": 4000 + np.random.uniform(-50, 50),
                },
                "network": {
                    "is_datacenter": np.random.random() < 0.6,
                    "country_code": np.random.choice(["US", "GB", "DE"]),
                },
                "interaction": {
                    "form_completion_time_ms": 8000 + np.random.uniform(-100, 100),
                    "time_to_first_interaction_ms": 1200 + np.random.uniform(-30, 30),
                    "idle_time_percentage": 14 + np.random.uniform(-0.5, 0.5),
                },
            }


class PairedDataGenerator:
    """
    Generates training data as baseline-attempt pairs.
    
    Labels:
    - 0: Legitimate (attempt matches baseline owner)
    - 1: Impersonation (different human using correct credentials)
    - 2: Bot/Automation
    """
    
    def __init__(self, seed: int = 42):
        np.random.seed(seed)
        self.profile_gen = UserProfileGenerator()
    
    def _baseline_from_profile(self, profile: Dict) -> Dict:
        """Convert a profile to baseline format (what we'd store in DB)."""
        return {
            "keystroke_dwell_mean": profile["dwell_time_mean"],
            "keystroke_dwell_std": profile["dwell_time_std"],
            "keystroke_flight_mean": profile["flight_time_mean"],
            "keystroke_flight_std": profile["flight_time_std"],
            "typing_speed_mean": profile["typing_speed"],
            "typing_speed_std": profile["typing_speed_std"],
            "mouse_velocity_mean": profile["mouse_velocity"],
            "mouse_velocity_std": profile["mouse_velocity_std"],
            "curvature_mean": profile["curvature"],
            "curvature_std": profile["curvature_std"],
            "click_precision_mean": profile["click_precision"],
            "click_precision_std": profile["click_precision_std"],
            "micro_corrections_mean": profile["micro_corrections"],
            "micro_corrections_std": profile["micro_corrections_std"],
            "form_time_mean": profile["form_time"],
            "form_time_std": profile["form_time_std"],
            "known_countries": [profile["primary_country"]],
            "uses_vpn": profile["uses_vpn_occasionally"],
        }
    
    def _compute_deviation_features(self, baseline: Dict, attempt: Dict) -> List[float]:
        """Compute z-score deviations between baseline and attempt."""
        
        def z_score(value: float, mean: float, std: float) -> float:
            if std < 0.001:
                return 0.0 if abs(value - mean) < 0.001 else 5.0
            return min(abs((value - mean) / std), 5.0)
        
        deviations = [
            # Keystroke deviations
            z_score(
                attempt["keystroke"]["dwell_time_mean_ms"],
                baseline["keystroke_dwell_mean"],
                baseline["keystroke_dwell_std"]
            ),
            z_score(
                attempt["keystroke"]["flight_time_mean_ms"],
                baseline["keystroke_flight_mean"],
                baseline["keystroke_flight_std"]
            ),
            z_score(
                attempt["keystroke"]["typing_speed_cpm"],
                baseline["typing_speed_mean"],
                baseline["typing_speed_std"]
            ),
            # Mouse deviations
            z_score(
                attempt["mouse"]["avg_velocity_px_ms"],
                baseline["mouse_velocity_mean"],
                baseline["mouse_velocity_std"]
            ),
            z_score(
                attempt["mouse"]["path_curvature_ratio"],
                baseline["curvature_mean"],
                baseline["curvature_std"]
            ),
            z_score(
                attempt["mouse"]["click_precision_px"],
                baseline["click_precision_mean"],
                baseline["click_precision_std"]
            ),
            z_score(
                attempt["mouse"]["micro_corrections_per_movement"],
                baseline["micro_corrections_mean"],
                baseline["micro_corrections_std"]
            ),
            # Interaction deviation
            z_score(
                attempt["interaction"]["form_completion_time_ms"],
                baseline["form_time_mean"],
                baseline["form_time_std"]
            ),
        ]
        
        return deviations
    
    def _compute_bot_signals(self, attempt: Dict) -> List[float]:
        """Compute bot detection signals."""
        k = attempt["keystroke"]
        m = attempt["mouse"]
        i = attempt["interaction"]
        
        return [
            float(k["typing_speed_cpm"] > 800),
            float(k["dwell_time_mean_ms"] < 30),
            float(k["dwell_time_std_ms"] < 5),
            float(m["avg_velocity_px_ms"] > 5),
            float(m["path_curvature_ratio"] < 1.05),
            float(m["click_precision_px"] < 2),
            float(m["micro_corrections_per_movement"] < 0.5),
            float(i["form_completion_time_ms"] < 1000),
            float(i["idle_time_percentage"] < 1),
        ]
    
    def _compute_context_signals(self, baseline: Dict, attempt: Dict) -> List[float]:
        """Compute contextual risk signals."""
        return [
            float(attempt["network"]["is_datacenter"]),
            float(attempt["network"]["country_code"] not in baseline["known_countries"]),
            # VPN user flag - reduces penalty for datacenter if user normally uses VPN
            float(baseline["uses_vpn"] and attempt["network"]["is_datacenter"]),
        ]
    
    def _compute_raw_features(self, attempt: Dict) -> List[float]:
        """Extract raw behavioral features."""
        return [
            attempt["keystroke"]["dwell_time_mean_ms"],
            attempt["keystroke"]["dwell_time_std_ms"],
            attempt["keystroke"]["flight_time_mean_ms"],
            attempt["keystroke"]["typing_speed_cpm"],
            attempt["mouse"]["avg_velocity_px_ms"],
            attempt["mouse"]["path_curvature_ratio"],
            attempt["mouse"]["click_precision_px"],
            attempt["mouse"]["micro_corrections_per_movement"],
            attempt["mouse"]["total_distance_px"],
            attempt["interaction"]["form_completion_time_ms"],
            attempt["interaction"]["time_to_first_interaction_ms"],
            attempt["interaction"]["idle_time_percentage"],
        ]
    
    def generate_feature_vector(self, baseline: Dict, attempt: Dict) -> np.ndarray:
        """Generate complete feature vector for a baseline-attempt pair."""
        features = []
        
        # Raw features (12)
        features.extend(self._compute_raw_features(attempt))
        
        # Deviation features (8) - THE KEY FOR IMPERSONATION DETECTION
        features.extend(self._compute_deviation_features(baseline, attempt))
        
        # Bot signals (9)
        features.extend(self._compute_bot_signals(attempt))
        
        # Context signals (3)
        features.extend(self._compute_context_signals(baseline, attempt))
        
        return np.array(features)
    
    def generate_dataset(
        self,
        n_samples: int = 10000,
        legitimate_ratio: float = 0.6,
        impersonation_ratio: float = 0.25,
        bot_ratio: float = 0.15
    ) -> Tuple[np.ndarray, np.ndarray, List[Dict]]:
        """
        Generate paired training dataset.
        
        Returns:
            X: Feature matrix
            y: Labels (0=legitimate, 1=impersonation, 2=bot)
            metadata: List of dicts with baseline/attempt details for debugging
        """
        n_legitimate = int(n_samples * legitimate_ratio)
        n_impersonation = int(n_samples * impersonation_ratio)
        n_bot = n_samples - n_legitimate - n_impersonation
        
        X = []
        y = []
        metadata = []
        
        # Generate legitimate samples
        for _ in range(n_legitimate):
            profile = self.profile_gen.generate_profile()
            baseline = self._baseline_from_profile(profile)
            
            # Vary the variance to simulate different conditions
            variance = np.random.choice([0.7, 1.0, 1.0, 1.0, 1.3], p=[0.1, 0.5, 0.2, 0.1, 0.1])
            attempt = self.profile_gen.generate_attempt_from_profile(profile, variance)
            
            features = self.generate_feature_vector(baseline, attempt)
            X.append(features)
            y.append(0)
            metadata.append({"type": "legitimate", "variance": variance})
        
        # Generate impersonation samples
        for _ in range(n_impersonation):
            # Create the account owner's profile
            owner_profile = self.profile_gen.generate_profile()
            baseline = self._baseline_from_profile(owner_profile)
            
            # Create impersonator's attempt
            _, attempt = self.profile_gen.generate_different_person_attempt(owner_profile)
            
            features = self.generate_feature_vector(baseline, attempt)
            X.append(features)
            y.append(1)
            metadata.append({"type": "impersonation"})
        
        # Generate bot samples
        for _ in range(n_bot):
            # Bot attacking a random account
            owner_profile = self.profile_gen.generate_profile()
            baseline = self._baseline_from_profile(owner_profile)
            
            attempt = self.profile_gen.generate_bot_attempt()
            
            features = self.generate_feature_vector(baseline, attempt)
            X.append(features)
            y.append(2)
            metadata.append({"type": "bot"})
        
        # Shuffle
        X = np.array(X)
        y = np.array(y)
        indices = np.random.permutation(len(X))
        
        return X[indices], y[indices], [metadata[i] for i in indices]
    
    def get_feature_names(self) -> List[str]:
        """Return feature names for interpretability."""
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
    
    def save_dataset(self, X: np.ndarray, y: np.ndarray, path: str):
        """Save dataset to file."""
        data = {
            "X": X.tolist(),
            "y": y.tolist(),
            "feature_names": self.get_feature_names(),
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "n_samples": len(y),
                "n_features": X.shape[1],
                "label_distribution": {
                    "legitimate": int((y == 0).sum()),
                    "impersonation": int((y == 1).sum()),
                    "bot": int((y == 2).sum()),
                }
            }
        }
        with open(path, "w") as f:
            json.dump(data, f)
        print(f"Saved {len(y)} samples to {path}")


if __name__ == "__main__":
    generator = PairedDataGenerator(seed=42)
    X, y, meta = generator.generate_dataset(n_samples=15000)
    
    print(f"Generated dataset: {X.shape}")
    print(f"Features: {generator.get_feature_names()}")
    print(f"Labels: {np.bincount(y)}")
    
    generator.save_dataset(X, y, "paired_training_data.json")