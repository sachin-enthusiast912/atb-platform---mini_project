from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from config.settings import Config
import logging

logger = logging.getLogger(__name__)

class BrowserManager:
    """Manage browser instances"""
    
    @staticmethod
    def get_chrome_options():
        """Get Chrome browser options"""
        options = Options()
        
        # Headless mode
        if Config.HEADLESS:
            options.add_argument('--headless=new')
            logger.info("Running in headless mode")
        
        # Common arguments
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-blink-features=AutomationControlled')
        
        # Disable notifications
        prefs = {
            "profile.default_content_setting_values.notifications": 2,
            "credentials_enable_service": False,
            "profile.password_manager_enabled": False
        }
        options.add_experimental_option("prefs", prefs)
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        return options
    
    @staticmethod
    def create_driver():
        """Create and return a Chrome WebDriver instance"""
        try:
            logger.info("Initializing Chrome WebDriver...")
            
            # Get Chrome options
            options = BrowserManager.get_chrome_options()
            
            # Create service with ChromeDriverManager
            service = Service(ChromeDriverManager().install())
            
            # Create driver
            driver = webdriver.Chrome(service=service, options=options)
            
            # Set timeouts
            driver.implicitly_wait(Config.IMPLICIT_WAIT)
            driver.set_page_load_timeout(Config.PAGE_LOAD_TIMEOUT)
            
            logger.info("Chrome WebDriver initialized successfully")
            return driver
            
        except Exception as e:
            logger.error(f"Failed to create WebDriver: {str(e)}")
            raise
    
    @staticmethod
    def quit_driver(driver):
        """Safely quit the driver"""
        try:
            if driver:
                driver.quit()
                logger.info("WebDriver closed successfully")
        except Exception as e:
            logger.error(f"Error closing WebDriver: {str(e)}")