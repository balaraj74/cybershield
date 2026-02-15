"""
CyberShield AI - Anomaly Detection Engine
Uses Isolation Forest for behavioral anomaly detection on endpoint processes
"""
import os
import json
import pickle
import logging
import numpy as np
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pathlib import Path

logger = logging.getLogger("cybershield.ai")

# Feature names matching the agent's ProcessBehavior.to_feature_vector()
FEATURE_NAMES = [
    "avg_cpu", "max_cpu", "avg_memory_mb", "max_memory_mb",
    "total_io_writes", "io_write_rate", "io_read_rate",
    "file_write_count", "file_rename_count",
    "connection_count", "outbound_connections",
    "thread_count", "execution_frequency",
    "parent_pid", "uptime_seconds",
]

MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "isolation_forest.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
TRAINING_DATA_PATH = MODEL_DIR / "training_data.json"


class AnomalyDetector:
    """
    AI-powered anomaly detection using Isolation Forest.
    
    How it works:
    1. Collect "normal" behavior data from endpoints
    2. Train Isolation Forest on normal behavior only
    3. Score new observations - anomalies get high scores (close to 1.0)
    4. Flag processes above threshold as suspicious
    
    Perfect for cybersecurity because:
    - No labeled attack data needed
    - Detects unknown/zero-day threats
    - Works well with high-dimensional process behavior data
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.training_samples = 0
        self.threshold = 0.65  # Anomaly score threshold
        self._training_data: List[List[float]] = []
        
        # Ensure models directory exists
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        
        # Try to load existing model
        self._load_model()

    def _load_model(self):
        """Load a previously trained model"""
        try:
            if MODEL_PATH.exists() and SCALER_PATH.exists():
                with open(MODEL_PATH, 'rb') as f:
                    self.model = pickle.load(f)
                with open(SCALER_PATH, 'rb') as f:
                    self.scaler = pickle.load(f)
                self.is_trained = True
                logger.info("✅ Loaded trained anomaly detection model")
        except Exception as e:
            logger.warning(f"Could not load model: {e}")
            self.model = None
            self.scaler = None
            self.is_trained = False

    def collect_training_data(self, behavior_data: List[Dict]) -> int:
        """
        Collect normal behavior data for training.
        Call this during the data collection phase (Weeks 1-4).
        Returns count of samples collected.
        """
        for proc in behavior_data:
            features = self._extract_features(proc)
            if features is not None:
                self._training_data.append(features)

        # Save training data periodically
        if len(self._training_data) % 100 == 0:
            self._save_training_data()

        logger.info(f"Training data: {len(self._training_data)} samples collected")
        return len(self._training_data)

    def train(self, min_samples: int = 200) -> bool:
        """
        Train the Isolation Forest model on collected normal behavior data.
        Requires at least `min_samples` to train effectively.
        """
        try:
            from sklearn.ensemble import IsolationForest
            from sklearn.preprocessing import StandardScaler
        except ImportError:
            logger.error("scikit-learn not installed! Run: pip install scikit-learn")
            return False

        if len(self._training_data) < min_samples:
            logger.warning(
                f"Not enough training data: {len(self._training_data)}/{min_samples}. "
                f"Continue collecting normal behavior data."
            )
            return False

        logger.info(f"🧠 Training anomaly detection model with {len(self._training_data)} samples...")

        # Convert to numpy array
        X = np.array(self._training_data)

        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Train Isolation Forest
        self.model = IsolationForest(
            n_estimators=150,        # Number of trees
            max_samples='auto',      # Subsample size
            contamination=0.05,      # Expected anomaly ratio (5%)
            max_features=1.0,        # Use all features
            random_state=42,
            n_jobs=-1,               # Use all CPU cores
        )
        self.model.fit(X_scaled)

        self.is_trained = True
        self.training_samples = len(self._training_data)

        # Save model
        self._save_model()

        logger.info(f"✅ Model trained successfully! ({self.training_samples} samples)")
        return True

    def detect_anomalies(
        self, 
        behavior_data: List[Dict],
        threshold: Optional[float] = None
    ) -> List[Dict]:
        """
        Detect anomalies in process behavior data.
        
        Returns list of detected threats with anomaly scores.
        Higher score = more anomalous (0.0 = normal, 1.0 = highly anomalous)
        """
        if not self.is_trained:
            # Use heuristic detection if model isn't trained yet
            return self._heuristic_detection(behavior_data)

        threshold = threshold or self.threshold
        threats = []

        for proc in behavior_data:
            features = self._extract_features(proc)
            if features is None:
                continue

            # Scale and predict
            X = np.array([features])
            X_scaled = self.scaler.transform(X)
            
            # Isolation Forest: -1 = anomaly, 1 = normal
            prediction = self.model.predict(X_scaled)[0]
            
            # Get anomaly score (higher = more anomalous)
            # score_samples returns negative values; more negative = more anomalous
            raw_score = self.model.score_samples(X_scaled)[0]
            # Convert to 0-1 scale (0 = normal, 1 = anomalous)
            anomaly_score = max(0.0, min(1.0, 0.5 - raw_score))

            if anomaly_score >= threshold:
                threat = {
                    "pid": proc.get("pid", 0),
                    "process_name": proc.get("name", "unknown"),
                    "anomaly_score": round(anomaly_score, 4),
                    "is_anomaly": True,
                    "reason": self._explain_anomaly(proc, features, anomaly_score),
                    "severity": self._score_to_severity(anomaly_score),
                    "features": dict(zip(FEATURE_NAMES, features)),
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }
                threats.append(threat)
                logger.warning(
                    f"🚨 ANOMALY: {proc.get('name')} (PID: {proc.get('pid')}) | "
                    f"Score: {anomaly_score:.3f} | {threat['reason']}"
                )

        return threats

    def _extract_features(self, proc: Dict) -> Optional[List[float]]:
        """Extract feature vector from process behavior data"""
        try:
            return [
                float(proc.get("avg_cpu", 0)),
                float(proc.get("max_cpu", 0)),
                float(proc.get("avg_memory_mb", 0)),
                float(proc.get("max_memory_mb", 0)),
                float(proc.get("total_io_writes", 0)),
                float(proc.get("io_write_rate", 0)),
                float(proc.get("io_read_rate", 0)),
                float(proc.get("file_write_count", 0)),
                float(proc.get("file_rename_count", 0)),
                float(proc.get("connection_count", 0)),
                float(proc.get("outbound_connections", 0)),
                float(proc.get("thread_count", 0)),
                float(proc.get("execution_frequency", 1)),
                float(proc.get("parent_pid", 0)),
                float(proc.get("uptime_seconds", 0)),
            ]
        except (ValueError, TypeError) as e:
            logger.debug(f"Feature extraction error: {e}")
            return None

    def _heuristic_detection(self, behavior_data: List[Dict]) -> List[Dict]:
        """
        Rule-based detection for when the AI model isn't trained yet.
        Uses simple thresholds based on common attack patterns.
        """
        threats = []
        
        for proc in behavior_data:
            anomaly_indicators = []
            score = 0.0

            name = proc.get("name", "").lower()
            
            # Skip system processes
            if name in {"system", "idle", "system idle process", "registry"}:
                continue

            # ── Ransomware Indicators ──

            # High CPU + High IO = possible cryptominer or ransomware
            if proc.get("max_cpu", 0) > 85 and proc.get("io_write_rate", 0) > 5_000_000:
                score += 0.3
                anomaly_indicators.append("High CPU with heavy disk writes")

            # Excessive file writes = possible ransomware
            if proc.get("file_write_count", 0) > 50:
                write_count = proc.get("file_write_count", 0)
                if write_count > 500:
                    score += 0.4
                    anomaly_indicators.append(f"Extreme file writes: {write_count}")
                else:
                    score += 0.25
                    anomaly_indicators.append(f"Excessive file writes: {write_count}")

            # File renames (ransomware behavior)
            if proc.get("file_rename_count", 0) > 10:
                score += 0.3
                anomaly_indicators.append(f"Mass file renames: {proc.get('file_rename_count')}")

            # ── Network Attack Indicators ──

            # Many outbound connections = possible C2 or exfiltration
            outbound = proc.get("outbound_connections", 0)
            if outbound > 20:
                if outbound > 100:
                    score += 0.4
                    anomaly_indicators.append(f"Extreme outbound connections: {outbound}")
                else:
                    score += 0.2
                    anomaly_indicators.append(f"Many outbound connections: {outbound}")

            # Very high total connection count = port scanning / DDoS
            conn_count = proc.get("connection_count", 0)
            if conn_count > 100:
                score += 0.3
                anomaly_indicators.append(f"Excessive connections: {conn_count}")

            # Extreme thread count = possible DDoS bot or scanner
            thread_count = proc.get("thread_count", 0)
            if thread_count > 50:
                score += 0.2
                anomaly_indicators.append(f"Extreme thread count: {thread_count}")

            # ── Data Exfiltration Indicators ──

            # Very high IO read rate = reading many files (data harvesting)
            io_read = proc.get("io_read_rate", 0)
            if io_read > 50_000_000:  # > 50 MB/s reads
                score += 0.3
                anomaly_indicators.append(f"Extreme disk read rate: {io_read/1_000_000:.0f} MB/s")

            # High read + outbound connections = data exfiltration pattern
            if io_read > 10_000_000 and outbound > 10:
                score += 0.2
                anomaly_indicators.append("Data exfiltration pattern: high reads + outbound connections")

            # ── C2 / Beaconing Indicators ──

            # High execution frequency = beaconing behavior
            exec_freq = proc.get("execution_frequency", 1)
            if exec_freq > 20 and outbound > 10:
                score += 0.3
                anomaly_indicators.append(f"Beaconing behavior: exec_freq={exec_freq} with outbound={outbound}")

            # ── General Suspicious Indicators ──

            # High memory usage = possible memory-based attack
            if proc.get("max_memory_mb", 0) > 2000:
                score += 0.15
                anomaly_indicators.append(f"High memory: {proc.get('max_memory_mb'):.0f}MB")

            # Very new process with high activity = suspicious
            uptime = proc.get("uptime_seconds", 999)
            if uptime < 30 and proc.get("avg_cpu", 0) > 50:
                score += 0.2
                anomaly_indicators.append("New process with immediate high CPU")
            
            # New process with suspicious characteristics
            if proc.get("is_new_process", False) and uptime < 120:
                # New + high connections
                if conn_count > 30:
                    score += 0.15
                    anomaly_indicators.append("New process with many connections")
                # New + high IO
                if proc.get("io_write_rate", 0) > 10_000_000:
                    score += 0.15
                    anomaly_indicators.append("New process with heavy IO")

            # Process running from temp directory
            exe_path = proc.get("exe_path", "")
            if exe_path and ("/tmp/" in exe_path or "\\temp\\" in exe_path.lower()):
                score += 0.15
                anomaly_indicators.append(f"Running from temp directory: {exe_path}")

            if score >= 0.5 and anomaly_indicators:
                threats.append({
                    "pid": proc.get("pid", 0),
                    "process_name": proc.get("name", "unknown"),
                    "anomaly_score": round(min(1.0, score), 4),
                    "is_anomaly": True,
                    "reason": "; ".join(anomaly_indicators),
                    "severity": self._score_to_severity(score),
                    "features": {k: proc.get(k, 0) for k in FEATURE_NAMES[:8]},
                    "detection_method": "heuristic",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                })

        return threats

    def _explain_anomaly(self, proc: Dict, features: List[float], score: float) -> str:
        """Generate human-readable explanation for the anomaly"""
        explanations = []

        if features[0] > 50:  # avg_cpu
            explanations.append(f"High avg CPU ({features[0]:.1f}%)")
        if features[1] > 80:  # max_cpu
            explanations.append(f"CPU spike ({features[1]:.1f}%)")
        if features[4] > 100:  # total_io_writes
            explanations.append(f"Heavy disk writes ({int(features[4])} ops)")
        if features[5] > 1_000_000:  # io_write_rate
            explanations.append(f"High write rate ({features[5]/1_000_000:.1f} MB/s)")
        if features[7] > 20:  # file_write_count
            explanations.append(f"Mass file modifications ({int(features[7])})")
        if features[8] > 5:  # file_rename_count
            explanations.append(f"File renames ({int(features[8])})")
        if features[9] > 15:  # connection_count
            explanations.append(f"Many connections ({int(features[9])})")
        if features[10] > 10:  # outbound_connections
            explanations.append(f"Outbound traffic ({int(features[10])} connections)")

        if not explanations:
            explanations.append(f"Unusual behavior pattern (score: {score:.3f})")

        return "; ".join(explanations)

    def _score_to_severity(self, score: float) -> str:
        """Convert anomaly score to severity level"""
        if score >= 0.9:
            return "critical"
        elif score >= 0.75:
            return "high"
        elif score >= 0.6:
            return "medium"
        else:
            return "low"

    def _save_model(self):
        """Save trained model to disk"""
        try:
            with open(MODEL_PATH, 'wb') as f:
                pickle.dump(self.model, f)
            with open(SCALER_PATH, 'wb') as f:
                pickle.dump(self.scaler, f)
            logger.info(f"Model saved to {MODEL_DIR}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")

    def _save_training_data(self):
        """Save training data to disk for persistence"""
        try:
            with open(TRAINING_DATA_PATH, 'w') as f:
                json.dump(self._training_data, f)
        except Exception as e:
            logger.debug(f"Failed to save training data: {e}")

    def load_training_data(self):
        """Load previously collected training data"""
        try:
            if TRAINING_DATA_PATH.exists():
                with open(TRAINING_DATA_PATH, 'r') as f:
                    self._training_data = json.load(f)
                logger.info(f"Loaded {len(self._training_data)} training samples")
        except Exception as e:
            logger.warning(f"Failed to load training data: {e}")

    def get_model_info(self) -> Dict:
        """Get information about the current model state"""
        return {
            "is_trained": self.is_trained,
            "training_samples": self.training_samples,
            "collected_samples": len(self._training_data),
            "threshold": self.threshold,
            "feature_count": len(FEATURE_NAMES),
            "feature_names": FEATURE_NAMES,
            "model_type": "IsolationForest" if self.is_trained else "Heuristic",
            "model_path": str(MODEL_PATH) if MODEL_PATH.exists() else None,
        }


# Singleton instance
_detector = None

def get_detector() -> AnomalyDetector:
    """Get or create the anomaly detector instance"""
    global _detector
    if _detector is None:
        _detector = AnomalyDetector()
    return _detector
