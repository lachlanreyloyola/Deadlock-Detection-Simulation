"""
Flask-based REST API for web GUI
"""
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import logging
import os
from pathlib import Path
from typing import Dict

from ..simulation.controller import SimulationController, SimulationConfig

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the correct paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
TEMPLATE_DIR = BASE_DIR / 'web' / 'templates'
STATIC_DIR = BASE_DIR / 'web' / 'static'

# Initialize Flask app with correct paths
app = Flask(__name__, 
            template_folder=str(TEMPLATE_DIR),
            static_folder=str(STATIC_DIR))
CORS(app)

# Global storage
active_simulations: Dict[str, SimulationController] = {}
simulation_counter = 0


@app.route('/')
def index():
    """Serve main HTML page"""
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error serving index.html: {e}")
        return f"Error: {e}. Template dir: {TEMPLATE_DIR}", 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'active_simulations': len(active_simulations),
        'template_dir': str(TEMPLATE_DIR),
        'static_dir': str(STATIC_DIR)
    })


@app.route('/api/simulation/create', methods=['POST'])
def create_simulation():
    """Create a new simulation instance"""
    global simulation_counter
    
    try:
        data = request.get_json() or {}
        
        config = SimulationConfig(
            detection_strategy=data.get('detection_strategy', 'periodic'),
            detection_interval=float(data.get('detection_interval', 1.0)),
            recovery_strategy=data.get('recovery_strategy', 'cost')
        )
        
        controller = SimulationController(config)
        
        simulation_counter += 1
        sim_id = f"sim_{simulation_counter}"
        active_simulations[sim_id] = controller
        
        logger.info(f"Created simulation {sim_id}")
        
        return jsonify({
            'simulation_id': sim_id,
            'status': 'created',
            'config': {
                'detection_strategy': config.detection_strategy,
                'detection_interval': config.detection_interval,
                'recovery_strategy': config.recovery_strategy
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating simulation: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/simulation/<sim_id>/process', methods=['POST'])
def add_process(sim_id: str):
    """Add a process to simulation"""
    if sim_id not in active_simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    try:
        controller = active_simulations[sim_id]
        data = request.get_json()
        
        process = controller.add_process(
            pid=data['pid'],
            priority=int(data.get('priority', 5)),
            execution_time=int(data.get('execution_time', 100))
        )
        
        return jsonify({
            'status': 'success',
            'process': process.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding process: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/simulation/<sim_id>/resource', methods=['POST'])
def add_resource(sim_id: str):
    """Add a resource to simulation"""
    if sim_id not in active_simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    try:
        controller = active_simulations[sim_id]
        data = request.get_json()
        
        resource = controller.add_resource(
            rid=data['rid'],
            instances=int(data.get('instances', 1)),
            resource_type=data.get('resource_type', 'Generic')
        )
        
        return jsonify({
            'status': 'success',
            'resource': resource.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding resource: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/simulation/<sim_id>/request', methods=['POST'])
def request_resource(sim_id: str):
    """Process requests a resource"""
    if sim_id not in active_simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    try:
        controller = active_simulations[sim_id]
        data = request.get_json()
        
        pid = data['process']
        rid = data['resource']
        
        process = controller.processes[pid]
        
        controller.request_resource(pid, rid)
        
        allocation_result = 'allocated' if rid in process.held_resources else 'blocked'
        
        return jsonify({
            'status': 'success',
            'allocation_result': allocation_result,
            'process_state': process.state,
            'system_state': controller.system_state.state
        }), 200
        
    except Exception as e:
        logger.error(f"Error requesting resource: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/simulation/<sim_id>/run', methods=['POST'])
def run_simulation(sim_id: str):
    """Run the simulation"""
    if sim_id not in active_simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    try:
        controller = active_simulations[sim_id]
        data = request.get_json() or {}
        
        steps = data.get('steps', None)
        if steps is not None:
            steps = int(steps)
        
        report = controller.run_simulation(steps=steps)
        
        return jsonify({
            'status': 'complete',
            'report': report
        }), 200
        
    except Exception as e:
        logger.error(f"Error running simulation: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/simulation/<sim_id>/state', methods=['GET'])
def get_state(sim_id: str):
    """Get current simulation state"""
    if sim_id not in active_simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    try:
        controller = active_simulations[sim_id]
        state = controller.get_current_state()
        return jsonify(state), 200
        
    except Exception as e:
        logger.error(f"Error getting state: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/simulation/<sim_id>/reset', methods=['POST'])
def reset_simulation(sim_id: str):
    """Reset simulation to initial state"""
    if sim_id not in active_simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    try:
        controller = active_simulations[sim_id]
        controller.reset()
        return jsonify({'status': 'reset'}), 200
        
    except Exception as e:
        logger.error(f"Error resetting simulation: {e}")
        return jsonify({'error': str(e)}), 400


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal error: {error}")
    return jsonify({'error': 'Internal server error', 'details': str(error)}), 500


def start_server(host: str = '0.0.0.0', port: int = 5000, debug: bool = False):
    """Start Flask development server"""
    logger.info(f"Starting Flask server on {host}:{port}")
    logger.info(f"Template directory: {TEMPLATE_DIR}")
    logger.info(f"Static directory: {STATIC_DIR}")
    
    # Verify directories exist
    if not TEMPLATE_DIR.exists():
        logger.error(f"Template directory does not exist: {TEMPLATE_DIR}")
        print(f"ERROR: Template directory not found at {TEMPLATE_DIR}")
        print("Please make sure web/templates/index.html exists")
        return
    
    if not STATIC_DIR.exists():
        logger.error(f"Static directory does not exist: {STATIC_DIR}")
        print(f"ERROR: Static directory not found at {STATIC_DIR}")
        print("Please make sure web/static/ directory exists")
        return
    
    print(f"\nAccess web interface at: http://localhost:{port}\n")
    
    app.run(host=host, port=port, debug=debug)


if __name__ == '__main__':
    start_server(debug=True)