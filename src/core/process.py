"""
Process class with integrated FSA for state management
"""
from typing import List, Set
from dataclasses import dataclass, field
import time
from .fsa import FiniteStateAutomaton


@dataclass
class Process:
    """
    Represents a process in the system
    
    Attributes:
        pid: Process identifier
        priority: Priority level (1=highest, 10=lowest)
        execution_time: Expected execution time in milliseconds
        held_resources: Set of currently held resources
        requested_resources: Queue of requested resources
        state: Current FSA state
    """
    pid: str
    priority: int = 5
    execution_time: int = 100
    held_resources: Set[str] = field(default_factory=set)
    requested_resources: List[str] = field(default_factory=list)
    creation_time: float = field(default_factory=time.time)
    blocked_time: float = 0
    victim_count: int = 0  # Times terminated as victim
    
    def __post_init__(self):
        """Initialize Process FSA"""
        # Define Process FSA
        states = {'Ready', 'Running', 'Blocked', 'Deadlocked', 'Terminated'}
        
        alphabet = {
            'start', 'request', 'allocate', 'deny', 
            'detect_cycle', 'terminate', 'resume'
        }
        
        # Transition function: (state, input) -> next_state
        transitions = {
            ('Ready', 'start'): 'Running',
            ('Running', 'request'): 'Running',
            ('Running', 'allocate'): 'Running',
            ('Running', 'deny'): 'Blocked',
            ('Running', 'terminate'): 'Terminated',
            ('Blocked', 'allocate'): 'Running',
            ('Blocked', 'detect_cycle'): 'Deadlocked',
            ('Deadlocked', 'terminate'): 'Terminated',
            ('Deadlocked', 'resume'): 'Blocked',
        }
        
        self.fsa = FiniteStateAutomaton(
            name=f"Process-{self.pid}",
            states=states,
            alphabet=alphabet,
            transition_function=transitions,
            initial_state='Ready',
            accepting_states={'Terminated'}
        )
    
    @property
    def state(self) -> str:
        """Get current state from FSA"""
        return self.fsa.current_state
    
    def transition(self, event: str, metadata: dict = None):
        """Trigger FSA state transition"""
        return self.fsa.transition(event, metadata)
    
    def request_resource(self, resource_id: str):
        """Request a resource"""
        if resource_id not in self.requested_resources:
            self.requested_resources.append(resource_id)
    
    def allocate_resource(self, resource_id: str):
        """Allocate resource to this process"""
        self.held_resources.add(resource_id)
        if resource_id in self.requested_resources:
            self.requested_resources.remove(resource_id)
    
    def release_resource(self, resource_id: str):
        """Release a held resource"""
        if resource_id in self.held_resources:
            self.held_resources.remove(resource_id)
    
    def release_all_resources(self):
        """Release all held resources"""
        released = self.held_resources.copy()
        self.held_resources.clear()
        return released
    
    def get_elapsed_time(self) -> float:
        """Get time since process creation"""
        return time.time() - self.creation_time
    
    def __repr__(self):
        return (
            f"Process(pid='{self.pid}', state='{self.state}', "
            f"priority={self.priority}, held={self.held_resources}, "
            f"requested={self.requested_resources})"
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            'pid': self.pid,
            'state': self.state,
            'priority': self.priority,
            'execution_time': self.execution_time,
            'held_resources': list(self.held_resources),
            'requested_resources': self.requested_resources,
            'elapsed_time': self.get_elapsed_time(),
            'victim_count': self.victim_count
        }