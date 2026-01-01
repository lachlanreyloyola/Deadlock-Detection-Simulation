"""
Deadlock detection using DFS-based cycle detection
"""
from typing import Dict, Set, Tuple
from dataclasses import dataclass
import time
import logging
from .wfg import WaitForGraph, build_wait_for_graph

logger = logging.getLogger(__name__)


@dataclass
class DetectionResult:
    deadlock_detected: bool
    deadlocked_processes: Set[str]
    wait_for_graph: WaitForGraph
    detection_timestamp: float
    detection_latency: float = 0.0

    def to_dict(self) -> dict:
        return {
            "deadlock_detected": self.deadlock_detected,
            "deadlocked_processes": list(self.deadlocked_processes),
            "wait_for_graph": self.wait_for_graph.to_dict(),
            "detection_timestamp": self.detection_timestamp,
            "detection_latency": self.detection_latency,
        }


class DeadlockDetector:
    def __init__(self):
        self.detection_count = 0
        self.total_detection_time = 0.0

    def detect(self, processes: Dict, resources: Dict) -> DetectionResult:
        start_time = time.time()
        self.detection_count += 1

        wfg = build_wait_for_graph(processes, resources)
        deadlock_detected, cycle_processes = self._detect_cycle_dfs(wfg)

        detection_latency = time.time() - start_time
        self.total_detection_time += detection_latency

        result = DetectionResult(
            deadlock_detected=deadlock_detected,
            deadlocked_processes=cycle_processes,
            wait_for_graph=wfg,
            detection_timestamp=time.time(),
            detection_latency=detection_latency * 1000,
        )

        if deadlock_detected:
            logger.warning(f"DEADLOCK DETECTED! Processes involved: {cycle_processes}")
        else:
            logger.info("No deadlock detected - system is safe")

        return result

    def _detect_cycle_dfs(self, wfg: WaitForGraph) -> Tuple[bool, Set[str]]:
        visited = set()
        stack = []
        on_stack = set()

        def dfs(node: str) -> Tuple[bool, Set[str]]:
            visited.add(node)
            stack.append(node)
            on_stack.add(node)

            for neighbor in wfg.get_neighbors(node):
                if neighbor not in visited:
                    found, cycle = dfs(neighbor)
                    if found:
                        return True, cycle
                elif neighbor in on_stack:
                    cycle_start = stack.index(neighbor)
                    return True, set(stack[cycle_start:])

            stack.pop()
            on_stack.remove(node)
            return False, set()

        for node in wfg.nodes:
            if node not in visited:
                found, cycle = dfs(node)
                if found:
                    return True, cycle

        return False, set()

    def get_statistics(self) -> dict:
        avg_time = (
            self.total_detection_time / self.detection_count
            if self.detection_count > 0
            else 0
        )
        return {
            "detection_count": self.detection_count,
            "total_detection_time": self.total_detection_time,
            "average_detection_time": avg_time * 1000,
        }
