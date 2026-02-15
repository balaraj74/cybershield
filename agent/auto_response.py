"""
CyberShield AI - Auto Response Module
Automatically responds to detected threats by killing processes
"""
import os
import signal
import logging
import psutil
from datetime import datetime
from typing import Optional, List, Dict
from dataclasses import dataclass, field, asdict

from config import PROTECTED_PROCESSES, AUTO_KILL_ENABLED, AUTO_KILL_THRESHOLD

logger = logging.getLogger("cybershield.response")


@dataclass
class ResponseAction:
    """Record of an auto-response action taken"""
    action_type: str  # kill_process, alert, isolate
    target_pid: int
    target_name: str
    anomaly_score: float
    reason: str
    success: bool
    error_message: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> dict:
        return asdict(self)


class AutoResponder:
    """
    Handles automatic threat response:
    - Kill suspicious processes
    - Log incidents
    - Track response history
    
    Safety features:
    - Protected process list (never kills system processes)
    - Configurable kill threshold
    - Can be disabled via config
    - All actions are logged
    """

    def __init__(self):
        self._action_log: List[ResponseAction] = []
        self._killed_pids: Dict[int, str] = {}  # pid -> process name
        self._enabled = AUTO_KILL_ENABLED
        self._threshold = AUTO_KILL_THRESHOLD

    def handle_threat(
        self,
        pid: int,
        process_name: str,
        anomaly_score: float,
        reason: str = "High anomaly score",
    ) -> ResponseAction:
        """
        Handle a detected threat. Decides whether to kill the process
        based on anomaly score and safety checks.
        """
        logger.warning(
            f"🚨 THREAT DETECTED: {process_name} (PID: {pid}) | "
            f"Score: {anomaly_score:.3f} | Reason: {reason}"
        )

        # Safety check: never kill protected processes
        if process_name.lower() in PROTECTED_PROCESSES:
            action = ResponseAction(
                action_type="alert_only",
                target_pid=pid,
                target_name=process_name,
                anomaly_score=anomaly_score,
                reason=f"Protected process - alert only: {reason}",
                success=True,
            )
            self._action_log.append(action)
            logger.info(f"Protected process {process_name} - alert only, no kill")
            return action

        # Check if auto-kill is enabled and score is above threshold
        if not self._enabled:
            action = ResponseAction(
                action_type="alert_only",
                target_pid=pid,
                target_name=process_name,
                anomaly_score=anomaly_score,
                reason=f"Auto-kill disabled - alert only: {reason}",
                success=True,
            )
            self._action_log.append(action)
            return action

        if anomaly_score < self._threshold:
            action = ResponseAction(
                action_type="alert",
                target_pid=pid,
                target_name=process_name,
                anomaly_score=anomaly_score,
                reason=f"Below kill threshold ({self._threshold}) - alert: {reason}",
                success=True,
            )
            self._action_log.append(action)
            return action

        # Attempt to kill the process
        return self._kill_process(pid, process_name, anomaly_score, reason)

    def _kill_process(
        self,
        pid: int,
        process_name: str,
        anomaly_score: float,
        reason: str,
    ) -> ResponseAction:
        """Kill a suspicious process"""
        try:
            proc = psutil.Process(pid)

            # Double-check the process name matches (PID reuse protection)
            if proc.name().lower() != process_name.lower():
                action = ResponseAction(
                    action_type="kill_aborted",
                    target_pid=pid,
                    target_name=process_name,
                    anomaly_score=anomaly_score,
                    reason=f"PID reuse detected - process is now {proc.name()}",
                    success=False,
                    error_message="PID reuse detected",
                )
                self._action_log.append(action)
                return action

            # Try graceful termination first
            proc.terminate()
            
            # Wait up to 3 seconds for process to terminate
            try:
                proc.wait(timeout=3)
                killed = True
            except psutil.TimeoutExpired:
                # Force kill if graceful failed
                proc.kill()
                try:
                    proc.wait(timeout=2)
                    killed = True
                except psutil.TimeoutExpired:
                    killed = False

            if killed:
                action = ResponseAction(
                    action_type="kill_process",
                    target_pid=pid,
                    target_name=process_name,
                    anomaly_score=anomaly_score,
                    reason=reason,
                    success=True,
                )
                self._killed_pids[pid] = process_name
                logger.warning(f"✅ KILLED: {process_name} (PID: {pid})")
            else:
                action = ResponseAction(
                    action_type="kill_failed",
                    target_pid=pid,
                    target_name=process_name,
                    anomaly_score=anomaly_score,
                    reason=reason,
                    success=False,
                    error_message="Process could not be terminated",
                )
                logger.error(f"❌ FAILED to kill: {process_name} (PID: {pid})")

        except psutil.NoSuchProcess:
            action = ResponseAction(
                action_type="kill_not_needed",
                target_pid=pid,
                target_name=process_name,
                anomaly_score=anomaly_score,
                reason=f"Process already terminated: {reason}",
                success=True,
            )
        except psutil.AccessDenied:
            action = ResponseAction(
                action_type="kill_failed",
                target_pid=pid,
                target_name=process_name,
                anomaly_score=anomaly_score,
                reason=reason,
                success=False,
                error_message="Access denied - need elevated privileges",
            )
            logger.error(f"❌ ACCESS DENIED: Cannot kill {process_name} (PID: {pid})")
        except Exception as e:
            action = ResponseAction(
                action_type="kill_error",
                target_pid=pid,
                target_name=process_name,
                anomaly_score=anomaly_score,
                reason=reason,
                success=False,
                error_message=str(e),
            )
            logger.error(f"❌ ERROR killing {process_name}: {e}")

        self._action_log.append(action)
        return action

    def execute_backend_command(self, command: dict) -> ResponseAction:
        """
        Execute a command from the backend dashboard.
        Allows operators to remotely kill processes.
        """
        action_type = command.get("action", "")
        pid = command.get("pid", 0)
        process_name = command.get("process_name", "unknown")

        if action_type == "kill_process":
            return self._kill_process(
                pid=pid,
                process_name=process_name,
                anomaly_score=1.0,
                reason=f"Remote command from dashboard: {command.get('reason', 'Manual kill')}",
            )
        else:
            action = ResponseAction(
                action_type="unknown_command",
                target_pid=pid,
                target_name=process_name,
                anomaly_score=0,
                reason=f"Unknown command: {action_type}",
                success=False,
            )
            self._action_log.append(action)
            return action

    def get_action_log(self) -> List[dict]:
        """Get and clear the action log"""
        actions = [a.to_dict() for a in self._action_log]
        self._action_log.clear()
        return actions

    def get_stats(self) -> dict:
        """Get responder statistics"""
        return {
            "enabled": self._enabled,
            "threshold": self._threshold,
            "total_kills": len(self._killed_pids),
            "killed_processes": dict(self._killed_pids),
            "pending_actions": len(self._action_log),
        }
