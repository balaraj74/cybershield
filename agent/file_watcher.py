"""
CyberShield AI - File System Watcher
Monitors file system changes for suspicious activity (ransomware detection)
"""
import os
import time
import logging
import threading
from datetime import datetime
from typing import Dict, List
from collections import defaultdict
from dataclasses import dataclass, field, asdict

try:
    from watchdog.observers import Observer
    from watchdog.events import (
        FileSystemEventHandler, FileCreatedEvent, FileModifiedEvent,
        FileDeletedEvent, FileMovedEvent
    )
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False

logger = logging.getLogger("cybershield.filesystem")

# File extensions commonly targeted by ransomware
SENSITIVE_EXTENSIONS = {
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.sql', '.db', '.mdb', '.accdb',
    '.psd', '.ai', '.dwg', '.dxf',
    '.txt', '.csv', '.json', '.xml',
    '.py', '.js', '.ts', '.java', '.cpp', '.h',
    '.mp3', '.mp4', '.avi', '.mkv',
}

# Known ransomware file extensions
RANSOMWARE_EXTENSIONS = {
    '.encrypted', '.locked', '.crypto', '.crypt', '.enc',
    '.locky', '.cerber', '.zepto', '.odin', '.thor',
    '.zzzzz', '.micro', '.crypted', '.crinf', '.r5a',
    '.XRNT', '.XTBL', '.crypt', '.R16M01D05', '.pzdc',
    '.good', '.LOL!', '.OMG!', '.RDM', '.RRK',
    '.encryptedRSA', '.crjoker', '.EnCiPhErEd', '.LeChiffre',
    '.keybtc@inbox_com', '.0x0', '.bleep', '.1999',
    '.vault', '.HA3', '.toxcrypt', '.magic',
    '.SUPERCRYPT', '.CTBL', '.CTB2', '.locky',
    '.petya', '.wannacry', '.wncry',
}


@dataclass
class FileEvent:
    """Represents a file system event"""
    event_type: str  # created, modified, deleted, moved
    file_path: str
    file_extension: str
    is_sensitive: bool
    is_ransomware_ext: bool
    timestamp: str
    src_path: str = ""
    dest_path: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class FileActivitySummary:
    """Summary of file activity over a time window"""
    total_events: int = 0
    created_count: int = 0
    modified_count: int = 0
    deleted_count: int = 0
    moved_count: int = 0
    renamed_count: int = 0
    sensitive_files_touched: int = 0
    ransomware_ext_detected: int = 0
    unique_directories: int = 0
    events_per_minute: float = 0.0
    mass_file_ops: bool = False  # True if >50 ops in 1 minute
    suspicious_renames: int = 0  # Files renamed to unusual extensions
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> dict:
        return asdict(self)


class FileSystemWatcher:
    """
    Monitors file system for suspicious activity patterns:
    - Mass file creation/deletion (ransomware indicator)
    - File renaming to suspicious extensions
    - High-frequency file modifications
    - Sensitive file access patterns
    """

    def __init__(self, watch_directories: List[str]):
        self._events: List[FileEvent] = []
        self._events_lock = threading.Lock()
        self._watch_dirs = [d for d in watch_directories if os.path.isdir(d)]
        self._observer = None
        self._running = False
        self._start_time = time.time()
        self._event_counts: Dict[str, int] = defaultdict(int)
        self._minute_events: List[float] = []  # timestamps of events in current minute

    def start(self):
        """Start watching file system"""
        if not WATCHDOG_AVAILABLE:
            logger.warning("watchdog not installed - file monitoring disabled")
            return

        if not self._watch_dirs:
            logger.warning("No valid watch directories configured")
            return

        self._observer = Observer()
        handler = _EventHandler(self)

        for directory in self._watch_dirs:
            try:
                self._observer.schedule(handler, directory, recursive=True)
                logger.info(f"Watching directory: {directory}")
            except Exception as e:
                logger.error(f"Failed to watch {directory}: {e}")

        self._observer.start()
        self._running = True
        logger.info(f"File system watcher started - monitoring {len(self._watch_dirs)} directories")

    def stop(self):
        """Stop watching file system"""
        if self._observer:
            self._observer.stop()
            self._observer.join(timeout=5)
        self._running = False
        logger.info("File system watcher stopped")

    def _record_event(self, event: FileEvent):
        """Record a file system event"""
        with self._events_lock:
            self._events.append(event)
            self._event_counts[event.event_type] += 1

            # Track per-minute rate
            now = time.time()
            self._minute_events.append(now)
            # Remove events older than 60 seconds
            self._minute_events = [t for t in self._minute_events if now - t < 60]

    def get_activity_summary(self) -> FileActivitySummary:
        """Get summary of file activity and reset counters"""
        with self._events_lock:
            events = list(self._events)
            self._events.clear()

        now = time.time()
        elapsed = now - self._start_time
        self._start_time = now

        # Calculate summary
        directories = set()
        summary = FileActivitySummary()
        summary.total_events = len(events)

        for event in events:
            if event.event_type == "created":
                summary.created_count += 1
            elif event.event_type == "modified":
                summary.modified_count += 1
            elif event.event_type == "deleted":
                summary.deleted_count += 1
            elif event.event_type == "moved":
                summary.moved_count += 1

            if event.is_sensitive:
                summary.sensitive_files_touched += 1
            if event.is_ransomware_ext:
                summary.ransomware_ext_detected += 1

            # Track directories
            dir_path = os.path.dirname(event.file_path)
            directories.add(dir_path)

            # Detect suspicious renames
            if event.event_type == "moved" and event.dest_path:
                _, new_ext = os.path.splitext(event.dest_path)
                _, old_ext = os.path.splitext(event.src_path)
                if new_ext != old_ext and new_ext.lower() in RANSOMWARE_EXTENSIONS:
                    summary.suspicious_renames += 1

        summary.unique_directories = len(directories)
        summary.events_per_minute = (len(events) / max(elapsed, 1)) * 60
        summary.mass_file_ops = len(self._minute_events) > 50
        summary.renamed_count = summary.moved_count

        return summary

    def get_recent_events(self, limit: int = 50) -> List[dict]:
        """Get recent file events (non-destructive peek)"""
        with self._events_lock:
            return [e.to_dict() for e in self._events[-limit:]]

    @property
    def is_running(self) -> bool:
        return self._running


class _EventHandler(FileSystemEventHandler if WATCHDOG_AVAILABLE else object):
    """Internal event handler for watchdog"""

    def __init__(self, watcher: FileSystemWatcher):
        if WATCHDOG_AVAILABLE:
            super().__init__()
        self._watcher = watcher

    def _process_event(self, event_type: str, src_path: str, dest_path: str = ""):
        _, ext = os.path.splitext(src_path)
        ext_lower = ext.lower()

        file_event = FileEvent(
            event_type=event_type,
            file_path=src_path,
            file_extension=ext_lower,
            is_sensitive=ext_lower in SENSITIVE_EXTENSIONS,
            is_ransomware_ext=ext_lower in RANSOMWARE_EXTENSIONS,
            timestamp=datetime.utcnow().isoformat() + "Z",
            src_path=src_path,
            dest_path=dest_path,
        )

        self._watcher._record_event(file_event)

        if file_event.is_ransomware_ext:
            logger.warning(f"⚠️ RANSOMWARE extension detected: {src_path}")

    def on_created(self, event):
        if not event.is_directory:
            self._process_event("created", event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._process_event("modified", event.src_path)

    def on_deleted(self, event):
        if not event.is_directory:
            self._process_event("deleted", event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self._process_event("moved", event.src_path, event.dest_path)
