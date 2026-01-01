/**
 * Deadlock Detection System - Frontend Application
 * Complete JavaScript for Web GUI
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE = 'http://localhost:5000/api';
let currentSimId = null;

// =============================================================================
// DOM ELEMENTS
// =============================================================================

const elements = {
    // Buttons
    createSimBtn: document.getElementById('createSimBtn'),
    runSimBtn: document.getElementById('runSimBtn'),
    resetBtn: document.getElementById('resetBtn'),
    addProcessBtn: document.getElementById('addProcessBtn'),
    addResourceBtn: document.getElementById('addResourceBtn'),
    requestBtn: document.getElementById('requestBtn'),
    
    // Inputs
    pidInput: document.getElementById('pidInput'),
    priorityInput: document.getElementById('priorityInput'),
    ridInput: document.getElementById('ridInput'),
    instancesInput: document.getElementById('instancesInput'),
    reqPidInput: document.getElementById('reqPidInput'),
    reqRidInput: document.getElementById('reqRidInput'),
    
    // Display Areas
    simIdDisplay: document.getElementById('simIdDisplay'),
    processList: document.getElementById('processList'),
    resourceList: document.getElementById('resourceList'),
    requestLog: document.getElementById('requestLog'),
    systemStateValue: document.getElementById('systemStateValue'),
    iterationValue: document.getElementById('iterationValue'),
    results: document.getElementById('results')
};

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function initializeEventListeners() {
    elements.createSimBtn.addEventListener('click', createSimulation);
    elements.runSimBtn.addEventListener('click', runSimulation);
    elements.resetBtn.addEventListener('click', resetSimulation);
    elements.addProcessBtn.addEventListener('click', addProcess);
    elements.addResourceBtn.addEventListener('click', addResource);
    elements.requestBtn.addEventListener('click', requestResource);
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Create a new simulation
 */
async function createSimulation() {
    try {
        const response = await fetch(`${API_BASE}/simulation/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                detection_strategy: 'periodic',
                detection_interval: 1.0,
                recovery_strategy: 'cost'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create simulation');
        }
        
        const data = await response.json();
        currentSimId = data.simulation_id;
        
        // Update UI
        elements.simIdDisplay.textContent = `Simulation ID: ${currentSimId}`;
        elements.simIdDisplay.style.display = 'block';
        
        // Enable buttons
        elements.addProcessBtn.disabled = false;
        elements.addResourceBtn.disabled = false;
        elements.requestBtn.disabled = false;
        elements.runSimBtn.disabled = false;
        elements.resetBtn.disabled = false;
        
        logMessage(`Simulation created: ${currentSimId}`);
        await updateSystemState();
        
    } catch (error) {
        console.error('Error creating simulation:', error);
        alert('Failed to create simulation. Make sure the server is running.');
    }
}

/**
 * Add a process to the simulation
 */
async function addProcess() {
    const pid = elements.pidInput.value.trim();
    const priority = parseInt(elements.priorityInput.value);
    
    if (!pid) {
        alert('Please enter a process ID');
        return;
    }
    
    if (!currentSimId) {
        alert('Please create a simulation first');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/simulation/${currentSimId}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid, priority })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add process');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayProcess(data.process);
            elements.pidInput.value = '';
            logMessage(`Added process: ${pid} (Priority: ${priority})`);
        }
        
    } catch (error) {
        console.error('Error adding process:', error);
        alert(`Failed to add process: ${error.message}`);
    }
}

/**
 * Add a resource to the simulation
 */
async function addResource() {
    const rid = elements.ridInput.value.trim();
    const instances = parseInt(elements.instancesInput.value);
    
    if (!rid) {
        alert('Please enter a resource ID');
        return;
    }
    
    if (!currentSimId) {
        alert('Please create a simulation first');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/simulation/${currentSimId}/resource`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rid, instances, resource_type: 'Generic' })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add resource');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayResource(data.resource);
            elements.ridInput.value = '';
            logMessage(`Added resource: ${rid} (Instances: ${instances})`);
        }
        
    } catch (error) {
        console.error('Error adding resource:', error);
        alert(`Failed to add resource: ${error.message}`);
    }
}

/**
 * Request a resource for a process
 */
async function requestResource() {
    const pid = elements.reqPidInput.value.trim();
    const rid = elements.reqRidInput.value.trim();
    
    if (!pid || !rid) {
        alert('Please enter both process and resource IDs');
        return;
    }
    
    if (!currentSimId) {
        alert('Please create a simulation first');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/simulation/${currentSimId}/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ process: pid, resource: rid })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to request resource');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const result = data.allocation_result;
            const icon = result === 'allocated' ? '✅' : '⏸️';
            const message = `${icon} ${pid} requested ${rid}: ${result.toUpperCase()}`;
            logMessage(message);
            
            // Update system state
            await updateSystemState();
        }
        
    } catch (error) {
        console.error('Error requesting resource:', error);
        logMessage(`Error: ${error.message}`, true);
    }
}

/**
 * Run the simulation
 */
async function runSimulation() {
    if (!currentSimId) {
        alert('Please create a simulation first');
        return;
    }
    
    try {
        // Disable button and show loading
        elements.runSimBtn.disabled = true;
        elements.runSimBtn.textContent = 'Running...';
        
        const response = await fetch(`${API_BASE}/simulation/${currentSimId}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ steps: 50 })
        });
        
        if (!response.ok) {
            throw new Error('Failed to run simulation');
        }
        
        const data = await response.json();
        
        if (data.status === 'complete') {
            displayResults(data.report);
            await updateSystemState();
            logMessage('Simulation completed successfully');
        }
        
    } catch (error) {
        console.error('Error running simulation:', error);
        alert('Failed to run simulation');
    } finally {
        // Re-enable button
        elements.runSimBtn.disabled = false;
        elements.runSimBtn.textContent = 'Run Simulation';
    }
}

/**
 * Reset the simulation
 */
async function resetSimulation() {
    if (!currentSimId) {
        alert('Please create a simulation first');
        return;
    }
    
    if (!confirm('Are you sure you want to reset the simulation?')) {
        return;
    }
    
    try {
        await fetch(`${API_BASE}/simulation/${currentSimId}/reset`, {
            method: 'POST'
        });
        
        // Clear UI
        elements.processList.innerHTML = '';
        elements.resourceList.innerHTML = '';
        elements.requestLog.innerHTML = '';
        elements.results.innerHTML = '<p class="placeholder">Run simulation to see results...</p>';
        
        logMessage('Simulation reset');
        await updateSystemState();
        
    } catch (error) {
        console.error('Error resetting simulation:', error);
        alert('Failed to reset simulation');
    }
}

/**
 * Update system state display
 */
async function updateSystemState() {
    if (!currentSimId) return;
    
    try {
        const response = await fetch(`${API_BASE}/simulation/${currentSimId}/state`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch system state');
        }
        
        const state = await response.json();
        
        // Update system state badge
        elements.systemStateValue.textContent = state.system_state;
        elements.systemStateValue.className = `value state-${state.system_state.toLowerCase()}`;
        
        // Update iteration counter
        elements.iterationValue.textContent = state.iteration;
        
        // Update process list
        elements.processList.innerHTML = '';
        for (const [pid, proc] of Object.entries(state.processes)) {
            displayProcess(proc);
        }
        
        // Update resource list
        elements.resourceList.innerHTML = '';
        for (const [rid, res] of Object.entries(state.resources)) {
            displayResource(res);
        }
        
    } catch (error) {
        console.error('Error updating state:', error);
    }
}

// =============================================================================
// UI DISPLAY FUNCTIONS
// =============================================================================

/**
 * Display a process in the process list
 */
function displayProcess(process) {
    const item = document.createElement('div');
    item.className = 'list-item';
    
    const stateClass = `process-state-${process.state}`;
    const heldResources = process.held_resources.length > 0 
        ? `Holds: [${process.held_resources.join(', ')}]` 
        : 'Holds: None';
    const requestedResources = process.requested_resources.length > 0
        ? `Requests: [${process.requested_resources.join(', ')}]`
        : '';
    
    item.innerHTML = `
        <strong>${process.pid}</strong>
        <span class="${stateClass}">${process.state}</span>
        (Priority: ${process.priority})
        <br>
        <small>${heldResources} ${requestedResources}</small>
    `;
    
    elements.processList.appendChild(item);
}

/**
 * Display a resource in the resource list
 */
function displayResource(resource) {
    const item = document.createElement('div');
    item.className = 'list-item';
    
    const allocatedTo = resource.allocated_to.length > 0
        ? `Allocated to: [${resource.allocated_to.join(', ')}]`
        : 'Allocated to: None';
    
    item.innerHTML = `
        <strong>${resource.rid}</strong>
        <span>${resource.state}</span>
        (${resource.available_instances}/${resource.total_instances} available)
        <br>
        <small>${allocatedTo}</small>
    `;
    
    elements.resourceList.appendChild(item);
}

/**
 * Display simulation results
 */
function displayResults(report) {
    const metrics = report.metrics;
    const summary = report.summary;
    
    let resultsHTML = `
        <h3>Summary</h3>
        <div class="metric">
            <span class="label">Total Iterations:</span>
            <span class="value">${summary.total_iterations}</span>
        </div>
        <div class="metric">
            <span class="label">Total Processes:</span>
            <span class="value">${summary.total_processes}</span>
        </div>
        <div class="metric">
            <span class="label">Total Resources:</span>
            <span class="value">${summary.total_resources}</span>
        </div>
        <div class="metric">
            <span class="label">Final System State:</span>
            <span class="value">${summary.system_final_state}</span>
        </div>
        
        <h3>Performance Metrics</h3>
        <div class="metric">
            <span class="label">Detections Run:</span>
            <span class="value">${metrics.total_detections}</span>
        </div>
        <div class="metric">
            <span class="label">Deadlocks Found:</span>
            <span class="value">${metrics.deadlocks_found}</span>
        </div>
        <div class="metric">
            <span class="label">Processes Terminated:</span>
            <span class="value">${metrics.processes_terminated}</span>
        </div>
        <div class="metric">
            <span class="label">Avg Detection Time:</span>
            <span class="value">${metrics.avg_detection_time.toFixed(2)} ms</span>
        </div>
    `;
    
    if (metrics.deadlocks_found > 0) {
        resultsHTML += `
            <div class="metric">
                <span class="label">Avg Recovery Time:</span>
                <span class="value">${(metrics.avg_recovery_time * 1000).toFixed(2)} ms</span>
            </div>
        `;
    }
    
    // Add process details
    resultsHTML += `<h3>Process Details</h3>`;
    for (const [pid, proc] of Object.entries(report.processes)) {
        const stateClass = `process-state-${proc.state}`;
        resultsHTML += `
            <div class="metric">
                <span class="label">${pid}:</span>
                <span class="value ${stateClass}">${proc.state} (Priority: ${proc.priority})</span>
            </div>
        `;
    }
    
    // Add resource details
    resultsHTML += `<h3>Resource Details</h3>`;
    for (const [rid, res] of Object.entries(report.resources)) {
        resultsHTML += `
            <div class="metric">
                <span class="label">${rid}:</span>
                <span class="value">${res.state} (${res.available_instances}/${res.total_instances} available)</span>
            </div>
        `;
    }
    
    elements.results.innerHTML = resultsHTML;
}

/**
 * Log a message to the request log
 */
function logMessage(message, isError = false) {
    const entry = document.createElement('div');
    entry.className = isError ? 'log-entry error' : 'log-entry';
    
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    
    elements.requestLog.appendChild(entry);
    elements.requestLog.scrollTop = elements.requestLog.scrollHeight;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if server is running
 */
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
            console.log('Server connection established');
            return true;
        }
    } catch (error) {
        console.error('Server not reachable:', error);
        alert('Cannot connect to server. Please make sure the Flask server is running:\npython main.py --web');
        return false;
    }
}

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('Initializing Deadlock Detection System...');
    
    // Check server connection
    const serverReady = await checkServerConnection();
    
    if (serverReady) {
        // Initialize event listeners
        initializeEventListeners();
        console.log('Application initialized successfully');
        logMessage('System ready. Click "Create Simulation" to begin.');
    } else {
        console.error('Application initialization failed');
    }
}

// =============================================================================
// AUTO-INITIALIZE ON PAGE LOAD
// =============================================================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// =============================================================================
// KEYBOARD SHORTCUTS (Optional Enhancement)
// =============================================================================

document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to run simulation
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (!elements.runSimBtn.disabled) {
            runSimulation();
        }
    }
    
    // Ctrl/Cmd + R to reset (prevent default page reload)
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (!elements.resetBtn.disabled) {
            resetSimulation();
        }
    }
});

// =============================================================================
// EXPORT FOR DEBUGGING (Optional)
// =============================================================================

// Make functions available in console for debugging
window.deadlockSystem = {
    createSimulation,
    addProcess,
    addResource,
    requestResource,
    runSimulation,
    resetSimulation,
    updateSystemState,
    currentSimId: () => currentSimId
};

console.log('Tip: Access system functions via window.deadlockSystem in console');