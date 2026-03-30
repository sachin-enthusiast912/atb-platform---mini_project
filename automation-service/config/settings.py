import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for automation service"""
    
    # Flask Settings
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # Backend API
    BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5000')
    API_TOKEN = os.getenv('API_TOKEN', '')
    
    # Browser Settings
    BROWSER = os.getenv('BROWSER', 'chrome').lower()
    HEADLESS = os.getenv('HEADLESS', 'false').lower() == 'true'
    IMPLICIT_WAIT = int(os.getenv('IMPLICIT_WAIT', 10))
    PAGE_LOAD_TIMEOUT = int(os.getenv('PAGE_LOAD_TIMEOUT', 30))
    
    # Test Application
    TEST_APP_URL = os.getenv('TEST_APP_URL', 'http://localhost:5173')
    
    # Screenshot Settings
    SCREENSHOT_ON_FAILURE = os.getenv('SCREENSHOT_ON_FAILURE', 'true').lower() == 'true'
    SCREENSHOT_DIR = os.getenv('SCREENSHOT_DIR', 'screenshots')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_DIR = os.getenv('LOG_DIR', 'logs')
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    SCREENSHOT_PATH = os.path.join(BASE_DIR, SCREENSHOT_DIR)
    LOG_PATH = os.path.join(BASE_DIR, LOG_DIR)
    
    @classmethod
    def ensure_directories(cls):
        """Create necessary directories if they don't exist"""
        os.makedirs(cls.SCREENSHOT_PATH, exist_ok=True)
        os.makedirs(cls.LOG_PATH, exist_ok=True)

# Ensure directories exist
Config.ensure_directories()