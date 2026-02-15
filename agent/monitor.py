"""
CyberShield AI - Process Monitor
Collects real-time process activity data for anomaly detection
"""
import time
import logging
import psutil
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict

logger = logging.getLogger("cybershield.monitor")


@dataclass
class ProcessSnapshot:
    """Single snapshot of a process's behavior"""
    pid: int
    name: str
    cpu_percent: float
    memory_mb: float
    num_threads: int
    num_connections: int
    num_open_files: int
    io_read_bytes: int
    io_write_bytes: int
    io_read_count: int
    io_write_count: int
    parent_pid: Optional[int]
    parent_name: Optional[str]
    username: Optional[str]
    create_time: float
    status: str
    exe_path: Optional[str]
    cmdline: Optional[str]
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass 
class ProcessBehavior:
    """Aggregated behavior metrics for a process over time"""
    pid: int
    name: str
    avg_cpu: float = 0.0
    max_cpu: float = 0.0
    avg_memory_mb: float = 0.0
    max_memory_mb: float = 0.0
    total_io_writes: int = 0
    total_io_reads: int = 0
    io_write_rate: float = 0.0       # bytes per second
    io_read_rate: float = 0.0        # bytes per second
    file_write_count: int = 0
    file_rename_count: int = 0
    connection_count: int = 0
    outbound_connections: int = 0
    thread_count: int = 0
    execution_frequency: int = 1      # how many times seen
    parent_pid: Optional[int] = None
    parent_name: Optional[str] = None
    exe_path: Optional[str] = None
    is_new_process: bool = False
    uptime_seconds: float = 0.0
    snapshot_count: int = 0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_feature_vector(self) -> List[float]:
        """Convert to feature vector for AI model"""
        return [
            self.avg_cpu,
            self.max_cpu,
            self.avg_memory_mb,
            self.max_memory_mb,
            float(self.total_io_writes),
            self.io_write_rate,
            self.io_read_rate,
            float(self.file_write_count),
            float(self.file_rename_count),
            float(self.connection_count),
            float(self.outbound_connections),
            float(self.thread_count),
            float(self.execution_frequency),
            float(self.parent_pid or 0),
            self.uptime_seconds,
        ]

    @staticmethod
    def feature_names() -> List[str]:
        return [
            "avg_cpu", "max_cpu", "avg_memory_mb", "max_memory_mb",
            "total_io_writes", "io_write_rate", "io_read_rate",
            "file_write_count", "file_rename_count",
            "connection_count", "outbound_connections",
            "thread_count", "execution_frequency",
            "parent_pid", "uptime_seconds",
        ]

    def to_dict(self) -> dict:
        return asdict(self)


class ProcessMonitor:
    """
    Monitors all running processes and collects behavior data.
    Tracks process lifecycle (new, running, terminated).
    """

    def __init__(self):
        self._known_processes: Dict[int, ProcessSnapshot] = {}
        self._behavior_log: Dict[int, ProcessBehavior] = {}
        self._new_processes: List[dict] = []
        self._terminated_processes: List[dict] = []
        self._last_scan_time: float = time.time()

    def scan_processes(self) -> List[ProcessSnapshot]:
        """
        Scan all running processes and collect metrics.
        Returns list of current process snapshots.
        """
        current_time = time.time()
        time_delta = current_time - self._last_scan_time
        self._last_scan_time = current_time

        current_pids = set()
        snapshots = []

        for proc in psutil.process_iter([
            'pid', 'name', 'cpu_percent', 'memory_info', 'num_threads',
            'io_counters', 'ppid',
            'username', 'create_time', 'status', 'exe', 'cmdline'
        ]):
            try:
                info = proc.info
                pid = info['pid']
                current_pids.add(pid)

                # Get connection count safely (must be fetched per-process)
                try:
                    connections = proc.net_connections()
                    num_connections = len(connections)
                except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess,
                        AttributeError, OSError):
                    connections = []
                    num_connections = 0

                # Get open files count safely (must be fetched per-process)
                try:
                    open_files = proc.open_files()
                    num_open_files = len(open_files)
                except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess,
                        OSError):
                    num_open_files = 0

                # Get IO counters safely
                try:
                    io = info.get('io_counters')
                    io_read_bytes = io.read_bytes if io else 0
                    io_write_bytes = io.write_bytes if io else 0
                    io_read_count = io.read_count if io else 0
                    io_write_count = io.write_count if io else 0
                except (psutil.AccessDenied, psutil.NoSuchProcess, AttributeError):
                    io_read_bytes = io_write_bytes = io_read_count = io_write_count = 0

                # Get memory in MB
                mem_info = info.get('memory_info')
                memory_mb = (mem_info.rss / (1024 * 1024)) if mem_info else 0.0

                # Get parent info
                parent_pid = info.get('ppid')
                parent_name = None
                if parent_pid:
                    try:
                        parent = psutil.Process(parent_pid)
                        parent_name = parent.name()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                # Get exe path safely
                try:
                    exe_path = info.get('exe')
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    exe_path = None

                # Get cmdline safely
                try:
                    cmdline = ' '.join(info.get('cmdline') or [])
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    cmdline = None

                snapshot = ProcessSnapshot(
                    pid=pid,
                    name=info.get('name', 'unknown'),
                    cpu_percent=info.get('cpu_percent', 0.0) or 0.0,
                    memory_mb=round(memory_mb, 2),
                    num_threads=info.get('num_threads', 0) or 0,
                    num_connections=num_connections,
                    num_open_files=num_open_files,
                    io_read_bytes=io_read_bytes,
                    io_write_bytes=io_write_bytes,
                    io_read_count=io_read_count,
                    io_write_count=io_write_count,
                    parent_pid=parent_pid,
                    parent_name=parent_name,
                    username=info.get('username'),
                    create_time=info.get('create_time', 0),
                    status=info.get('status', 'unknown'),
                    exe_path=exe_path,
                    cmdline=cmdline,
                )
                snapshots.append(snapshot)

                # Detect new processes
                if pid not in self._known_processes:
                    self._new_processes.append({
                        "pid": pid,
                        "name": snapshot.name,
                        "exe_path": exe_path,
                        "parent_pid": parent_pid,
                        "parent_name": parent_name,
                        "timestamp": snapshot.timestamp,
                    })
                    logger.debug(f"New process detected: {snapshot.name} (PID: {pid})")

                # Update behavior log
                self._update_behavior(pid, snapshot, time_delta)
                self._known_processes[pid] = snapshot

            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        # Detect terminated processes
        for pid in list(self._known_processes.keys()):
            if pid not in current_pids:
                old = self._known_processes.pop(pid)
                self._terminated_processes.append({
                    "pid": pid,
                    "name": old.name,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                })
                if pid in self._behavior_log:
                    del self._behavior_log[pid]

        logger.info(f"Scanned {len(snapshots)} processes | "
                     f"New: {len(self._new_processes)} | "
                     f"Terminated: {len(self._terminated_processes)}")
        return snapshots

    def _update_behavior(self, pid: int, snapshot: ProcessSnapshot, time_delta: float):
        """Update aggregated behavior metrics for a process"""
        if pid not in self._behavior_log:
            self._behavior_log[pid] = ProcessBehavior(
                pid=pid,
                name=snapshot.name,
                parent_pid=snapshot.parent_pid,
                parent_name=snapshot.parent_name,
                exe_path=snapshot.exe_path,
                is_new_process=True,
            )

        behavior = self._behavior_log[pid]
        behavior.snapshot_count += 1
        n = behavior.snapshot_count

        # Running averages
        behavior.avg_cpu = ((behavior.avg_cpu * (n - 1)) + snapshot.cpu_percent) / n
        behavior.max_cpu = max(behavior.max_cpu, snapshot.cpu_percent)
        behavior.avg_memory_mb = ((behavior.avg_memory_mb * (n - 1)) + snapshot.memory_mb) / n
        behavior.max_memory_mb = max(behavior.max_memory_mb, snapshot.memory_mb)

        # IO rates
        if pid in self._known_processes and time_delta > 0:
            prev = self._known_processes[pid]
            write_delta = snapshot.io_write_bytes - prev.io_write_bytes
            read_delta = snapshot.io_read_bytes - prev.io_read_bytes
            behavior.io_write_rate = max(0, write_delta / time_delta)
            behavior.io_read_rate = max(0, read_delta / time_delta)
            behavior.total_io_writes += max(0, snapshot.io_write_count - prev.io_write_count)
            behavior.total_io_reads += max(0, snapshot.io_read_count - prev.io_read_count)

        # Connection tracking
        behavior.connection_count = snapshot.num_connections
        behavior.thread_count = snapshot.num_threads
        behavior.execution_frequency = n

        # Uptime
        if snapshot.create_time > 0:
            behavior.uptime_seconds = time.time() - snapshot.create_time

        behavior.timestamp = snapshot.timestamp

    def get_behavior_report(self) -> Dict:
        """
        Get current behavior report and reset counters.
        Returns data ready to send to backend.
        """
        behaviors = [b.to_dict() for b in self._behavior_log.values()]
        new_procs = list(self._new_processes)
        term_procs = list(self._terminated_processes)

        # Reset event logs
        self._new_processes.clear()
        self._terminated_processes.clear()

        # Reset is_new_process flags
        for b in self._behavior_log.values():
            b.is_new_process = False

        return {
            "process_behaviors": behaviors,
            "new_processes": new_procs,
            "terminated_processes": term_procs,
            "total_processes": len(self._behavior_log),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    def get_system_metrics(self) -> Dict:
        """Get overall system resource metrics"""
        cpu_percent = psutil.cpu_percent(interval=0)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        net_io = psutil.net_io_counters()
        boot_time = psutil.boot_time()

        return {
            "cpu_percent": cpu_percent,
            "cpu_count": psutil.cpu_count(),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_percent": memory.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_percent": disk.percent,
            "net_bytes_sent": net_io.bytes_sent,
            "net_bytes_recv": net_io.bytes_recv,
            "net_connections": len(psutil.net_connections()),
            "boot_time": datetime.fromtimestamp(boot_time).isoformat() + "Z",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
