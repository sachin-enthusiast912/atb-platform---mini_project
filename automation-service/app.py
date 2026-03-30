from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import subprocess
import threading
import os
import psutil
from config.settings import Config
from datetime import datetime
import traceback

# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)

# Store for running tests
running_tests = {}


def get_system_info():
    """Get system information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            'cpu_usage': f"{cpu_percent}%",
            'memory_usage': f"{memory.percent}%",
            'memory_available': f"{memory.available / (1024**3):.2f} GB",
            'disk_usage': f"{disk.percent}%",
            'disk_free': f"{disk.free / (1024**3):.2f} GB"
        }
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}")
        return {}


def execute_test_async(test_case_id, execution_id):
    """Execute test in background"""
    try:
        logger.info("=" * 60)
        logger.info(f"ASYNC TEST EXECUTION STARTED")
        logger.info(f"TestCase ID: {test_case_id}")
        logger.info(f"Execution ID: {execution_id}")
        logger.info("=" * 60)
        
        # Store test info
        running_tests[execution_id] = {
            'test_case_id': test_case_id,
            'status': 'running',
            'started_at': datetime.now().isoformat()
        }
        
        # Get path to test runner
        test_runner_path = os.path.join(os.path.dirname(__file__), 'test_runner.py')
        logger.info(f"Test runner path: {test_runner_path}")
        
        # Check if file exists
        if not os.path.exists(test_runner_path):
            logger.error(f"❌ TEST RUNNER NOT FOUND: {test_runner_path}")
            if execution_id in running_tests:
                running_tests[execution_id]['status'] = 'error'
                running_tests[execution_id]['error'] = 'test_runner.py not found'
            return
        
        logger.info(f"✅ Test runner found")
        import sys
        logger.info(f"Running: {sys.executable} {test_runner_path} {test_case_id} {execution_id}")
        
        # Run Python test runner
        process = subprocess.Popen(
            [sys.executable, test_runner_path, test_case_id, execution_id],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        
        logger.info(f"✅ Process started with PID: {process.pid}")
        
        # Wait for completion
        stdout, stderr = process.communicate()
        
        # Log output
        if stdout:
            logger.info(f"STDOUT:\n{stdout}")
        if stderr:
            logger.error(f"STDERR:\n{stderr}")
        
        logger.info(f"Process exited with code: {process.returncode}")
        
        # Update status
        if execution_id in running_tests:
            running_tests[execution_id]['status'] = 'completed' if process.returncode == 0 else 'error'
            running_tests[execution_id]['completed_at'] = datetime.now().isoformat()
            if process.returncode != 0 and stderr:
                running_tests[execution_id]['error'] = stderr
        
        logger.info("=" * 60)
        logger.info(f"ASYNC TEST EXECUTION COMPLETED")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error("=" * 60)
        logger.error(f"❌ ERROR IN ASYNC TEST EXECUTION")
        logger.error(f"Error: {str(e)}")
        logger.error(traceback.format_exc())
        logger.error("=" * 60)
        
        if execution_id in running_tests:
            running_tests[execution_id]['status'] = 'error'
            running_tests[execution_id]['error'] = str(e)


@app.route('/', methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({
        'service': 'QA Platform - Automation Service',
        'version': '1.0.0',
        'status': 'running',
        'description': 'Python Flask service for automated test execution using Selenium',
        'endpoints': {
            'health': '/health',
            'execute': '/execute',
            'status': '/status/<execution_id>',
            'running': '/running'
        },
        'documentation': '/docs'
    })


@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    Returns service status and system information
    """
    try:
        # Check if Chrome/ChromeDriver is available
        chrome_available = False
        try:
            from selenium import webdriver
            from webdriver_manager.chrome import ChromeDriverManager
            chrome_available = True
        except Exception:
            pass
        
        # Get system info
        system_info = get_system_info()
        
        # Count running tests
        active_tests = sum(1 for test in running_tests.values() if test.get('status') == 'running')
        
        health_data = {
            'status': 'healthy',
            'service': 'Automation Service',
            'timestamp': datetime.now().isoformat(),
            'uptime': 'Service is running',
            'dependencies': {
                'selenium': chrome_available,
                'python': True,
                'flask': True
            },
            'system': system_info,
            'tests': {
                'running': active_tests,
                'total_executed': len(running_tests),
                'in_queue': 0
            },
            'config': {
                'backend_url': Config.BACKEND_API_URL,
                'test_app_url': Config.TEST_APP_URL,
                'browser': Config.BROWSER,
                'headless': Config.HEADLESS,
                'screenshot_on_failure': Config.SCREENSHOT_ON_FAILURE
            }
        }
        
        return jsonify(health_data), 200
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/execute', methods=['POST'])
def execute_test():
    """
    Execute a test
    
    Request Body:
    {
        "testCaseId": "abc123",
        "executionId": "xyz789"
    }
    
    Returns:
    {
        "success": true,
        "message": "Test execution started",
        "executionId": "xyz789"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        test_case_id = data.get('testCaseId')
        execution_id = data.get('executionId')
        
        if not test_case_id or not execution_id:
            return jsonify({
                'success': False,
                'error': 'testCaseId and executionId are required'
            }), 400
        
        # Check if already running
        if execution_id in running_tests and running_tests[execution_id].get('status') == 'running':
            return jsonify({
                'success': False,
                'error': 'Test is already running',
                'executionId': execution_id
            }), 409
        
        # Start test in background thread
        thread = threading.Thread(
            target=execute_test_async,
            args=(test_case_id, execution_id)
        )
        thread.daemon = True
        thread.start()
        
        logger.info(f"Test execution started: {execution_id}")
        
        return jsonify({
            'success': True,
            'message': 'Test execution started',
            'executionId': execution_id,
            'testCaseId': test_case_id,
            'startedAt': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting test execution: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/status/<execution_id>', methods=['GET'])
def get_status(execution_id):
    """
    Get test execution status
    
    Returns:
    {
        "executionId": "xyz789",
        "status": "running" | "completed" | "error",
        "testCaseId": "abc123",
        "startedAt": "2026-03-05T...",
        "completedAt": "2026-03-05T..." (if completed)
    }
    """
    if execution_id in running_tests:
        test_info = running_tests[execution_id]
        return jsonify({
            'executionId': execution_id,
            'status': test_info.get('status', 'unknown'),
            'testCaseId': test_info.get('test_case_id'),
            'startedAt': test_info.get('started_at'),
            'completedAt': test_info.get('completed_at'),
            'error': test_info.get('error')
        }), 200
    else:
        return jsonify({
            'executionId': execution_id,
            'status': 'not_found',
            'message': 'Execution not found or already removed'
        }), 404


@app.route('/running', methods=['GET'])
def get_running_tests():
    """
    Get all running tests
    
    Returns:
    {
        "count": 2,
        "tests": [...]
    }
    """
    tests = []
    for execution_id, test_info in running_tests.items():
        if test_info.get('status') == 'running':
            tests.append({
                'executionId': execution_id,
                'testCaseId': test_info.get('test_case_id'),
                'startedAt': test_info.get('started_at'),
                'status': test_info.get('status')
            })
    
    return jsonify({
        'count': len(tests),
        'tests': tests
    }), 200


@app.route('/stats', methods=['GET'])
def get_stats():
    """
    Get automation service statistics
    
    Returns execution statistics and system info
    """
    total_tests = len(running_tests)
    running = sum(1 for t in running_tests.values() if t.get('status') == 'running')
    completed = sum(1 for t in running_tests.values() if t.get('status') == 'completed')
    errors = sum(1 for t in running_tests.values() if t.get('status') == 'error')
    
    return jsonify({
        'total_executions': total_tests,
        'running': running,
        'completed': completed,
        'errors': errors,
        'system': get_system_info(),
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/docs', methods=['GET'])
def docs():
    """API documentation"""
    return jsonify({
        'service': 'QA Platform - Automation Service',
        'version': '1.0.0',
        'endpoints': [
            {
                'method': 'GET',
                'path': '/',
                'description': 'Service information'
            },
            {
                'method': 'GET',
                'path': '/health',
                'description': 'Health check - returns service status and system info'
            },
            {
                'method': 'POST',
                'path': '/execute',
                'description': 'Execute a test',
                'body': {
                    'testCaseId': 'string (required)',
                    'executionId': 'string (required)'
                }
            },
            {
                'method': 'GET',
                'path': '/status/<execution_id>',
                'description': 'Get execution status'
            },
            {
                'method': 'GET',
                'path': '/running',
                'description': 'Get all running tests'
            },
            {
                'method': 'GET',
                'path': '/stats',
                'description': 'Get service statistics'
            }
        ]
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': str(error)
    }), 500


if __name__ == '__main__':
    logger.info("="*60)
    logger.info("Starting QA Platform Automation Service")
    logger.info(f"Port: {Config.FLASK_PORT}")
    logger.info(f"Backend API: {Config.BACKEND_API_URL}")
    logger.info(f"Test App URL: {Config.TEST_APP_URL}")
    logger.info(f"Browser: {Config.BROWSER}")
    logger.info(f"Headless: {Config.HEADLESS}")
    logger.info("="*60)
    
    app.run(
        host='0.0.0.0',
        port=Config.FLASK_PORT,
        debug=(Config.FLASK_ENV == 'development')
    )