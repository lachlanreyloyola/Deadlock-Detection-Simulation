/**
 * Deadlock Detection System - Frontend Application
 * Complete JavaScript for Web GUI with WFG & FSA visualization
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
    results: document.getElementById('results'),

    // Visualization Canvases
    wfgCanvas: document.getElementById('wfgCanvas'),
    fsaCanvas: document.getElementById('fsaCanvas')
};

// =============================================================================
// VISUALIZERS
// =============================================================================
let wfgVisualizer = null;
let fsaVisualizer = null;

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

        if (!response.ok) throw new Error('Failed to create simulation');

        const data = await response.json();
        currentSimId = data.simulation_id;

        // Update UI
        elements.simIdDisplay.textContent = `Simulation ID: ${currentSimId}`;
        elements.simIdDisplay.style.display = 'block';
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

async function addProcess() {
    const pid = elements.pidInput.value.trim();
    const priority = parseInt(elements.priorityInput.value);

    if (!pid) return alert('Please enter a process ID');
    if (!currentSimId) return alert('Please create a simulation first');

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
            await updateSystemState();
        }

    } catch (error) {
        console.error('Error adding process:', error);
        alert(`Failed to add process: ${error.message}`);
    }
}

async function addResource() {
    const rid = elements.ridInput.value.trim();
    const instances = parseInt(elements.instancesInput.value);

    if (!rid) return alert('Please enter a resource ID');
    if (!currentSimId) return alert('Please create a simulation first');

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
            await updateSystemState();
        }

    } catch (error) {
        console.error('Error adding resource:', error);
        alert(`Failed to add resource: ${error.message}`);
    }
}

async function requestResource() {
    const pid = elements.reqPidInput.value.trim();
    const rid = elements.reqRidInput.value.trim();

    if (!pid || !rid) return alert('Please enter both process and resource IDs');
    if (!currentSimId) return alert('Please create a simulation first');

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
            logMessage(`${icon} ${pid} requested ${rid}: ${result.toUpperCase()}`);
            await updateSystemState();
        }

    } catch (error) {
        console.error('Error requesting resource:', error);
        logMessage(`Error: ${error.message}`, true);
    }
}

async function runSimulation() {
    if (!currentSimId) return alert('Please create a simulation first');

    try {
        elements.runSimBtn.disabled = true;
        elements.runSimBtn.textContent = 'Running...';

        const response = await fetch(`${API_BASE}/simulation/${currentSimId}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ steps: 50 })
        });

        if (!response.ok) throw new Error('Failed to run simulation');

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
        elements.runSimBtn.disabled = false;
        elements.runSimBtn.textContent = 'Run Simulation';
    }
}

async function resetSimulation() {
    if (!currentSimId) return alert('Please create a simulation first');
    if (!confirm('Are you sure you want to reset the simulation?')) return;

    try {
        await fetch(`${API_BASE}/simulation/${currentSimId}/reset`, { method: 'POST' });

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

// =============================================================================
// UPDATE SYSTEM STATE & VISUALIZATION
// =============================================================================

async function updateSystemState() {
    if (!currentSimId) return;

    try {
        const response = await fetch(`${API_BASE}/simulation/${currentSimId}/state`);
        if (!response.ok) throw new Error('Failed to fetch system state');

        const state = await response.json();

        // Update system state
        elements.systemStateValue.textContent = state.system_state;
        elements.systemStateValue.className = `value state-${state.system_state.toLowerCase()}`;
        elements.iterationValue.textContent = state.iteration;

        // Update process/resource lists
        elements.processList.innerHTML = '';
        for (const proc of Object.values(state.processes)) displayProcess(proc);

        elements.resourceList.innerHTML = '';
        for (const res of Object.values(state.resources)) displayResource(res);

        // Draw visualizations
        if (wfgVisualizer && state.wait_for_graph) {
            wfgVisualizer.drawWaitForGraph(state.wait_for_graph);
        }
        if (fsaVisualizer && state.fsa) {
            fsaVisualizer.drawFSADiagram(state.fsa.states, state.fsa.current);
        }

    } catch (error) {
        console.error('Error updating state:', error);
    }
}

// =============================================================================
// UI DISPLAY FUNCTIONS
// =============================================================================

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

function displayResults(report) {
    const metrics = report.metrics;
    const summary = report.summary;

    let resultsHTML = `
        <h3>Summary</h3>
        <div class="metric"><span class="label">Total Iterations:</span><span class="value">${summary.total_iterations}</span></div>
        <div class="metric"><span class="label">Total Processes:</span><span class="value">${summary.total_processes}</span></div>
        <div class="metric"><span class="label">Total Resources:</span><span class="value">${summary.total_resources}</span></div>
        <div class="metric"><span class="label">Final System State:</span><span class="value">${summary.system_final_state}</span></div>
        
        <h3>Performance Metrics</h3>
        <div class="metric"><span class="label">Detections Run:</span><span class="value">${metrics.total_detections}</span></div>
        <div class="metric"><span class="label">Deadlocks Found:</span><span class="value">${metrics.deadlocks_found}</span></div>
        <div class="metric"><span class="label">Processes Terminated:</span><span class="value">${metrics.processes_terminated}</span></div>
        <div class="metric"><span class="label">Avg Detection Time:</span><span class="value">${metrics.avg_detection_time.toFixed(2)} ms</span></div>
    `;
    if (metrics.deadlocks_found > 0) {
        resultsHTML += `<div class="metric"><span class="label">Avg Recovery Time:</span><span class="value">${(metrics.avg_recovery_time*1000).toFixed(2)} ms</span></div>`;
    }

    resultsHTML += `<h3>Process Details</h3>`;
    for (const [pid, proc] of Object.entries(report.processes)) {
        const stateClass = `process-state-${proc.state}`;
        resultsHTML += `<div class="metric"><span class="label">${pid}:</span><span class="value ${stateClass}">${proc.state} (Priority: ${proc.priority})</span></div>`;
    }

    resultsHTML += `<h3>Resource Details</h3>`;
    for (const [rid, res] of Object.entries(report.resources)) {
        resultsHTML += `<div class="metric"><span class="label">${rid}:</span><span class="value">${res.state} (${res.available_instances}/${res.total_instances} available)</span></div>`;
    }

    elements.results.innerHTML = resultsHTML;
}

function logMessage(message, isError = false) {
    const entry = document.createElement('div');
    entry.className = isError ? 'log-entry error' : 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.requestLog.appendChild(entry);
    elements.requestLog.scrollTop = elements.requestLog.scrollHeight;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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

async function initializeApp() {
    console.log('Initializing Deadlock Detection System...');
    const serverReady = await checkServerConnection();

    if (serverReady) {
        initializeEventListeners();
        wfgVisualizer = new DeadlockVisualizer('wfgCanvas');
        fsaVisualizer = new DeadlockVisualizer('fsaCanvas');
        console.log('Application initialized successfully');
        logMessage('System ready. Click "Create Simulation" to begin.');
    } else {
        console.error('Application initialization failed');
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runSimulation();
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        resetSimulation();
    }
});

// Export for console debugging
window.deadlockSystem = { createSimulation, addProcess, addResource, requestResource, runSimulation, resetSimulation, updateSystemState, currentSimId: () => currentSimId };
