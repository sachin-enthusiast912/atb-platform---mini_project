import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from config.settings import Config

logger = logging.getLogger(__name__)

class BaseTest:
    """Base test class with common methods"""
    
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, Config.IMPLICIT_WAIT)
    
    def navigate_to(self, url):
        """Navigate to a URL"""
        try:
            logger.info(f"Navigating to: {url}")
            self.driver.get(url)
            return True
        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {str(e)}")
            return False
    
    def find_element(self, by, value, timeout=10):
        """Find an element with explicit wait"""
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return element
        except TimeoutException:
            logger.error(f"Element not found: {by}={value}")
            return None
    
    def find_elements(self, by, value):
        """Find multiple elements"""
        try:
            return self.driver.find_elements(by, value)
        except Exception as e:
            logger.error(f"Failed to find elements: {str(e)}")
            return []
    
    def click_element(self, by, value, timeout=10):
        """Click an element"""
        try:
            element = self.find_element(by, value, timeout)
            if element:
                element.click()
                logger.info(f"Clicked element: {by}={value}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to click element: {str(e)}")
            return False
    
    def input_text(self, by, value, text, clear_first=True):
        """Input text into an element"""
        try:
            element = self.find_element(by, value)
            if element:
                if clear_first:
                    element.clear()
                element.send_keys(text)
                logger.info(f"Input text into: {by}={value}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to input text: {str(e)}")
            return False
    
    def get_text(self, by, value):
        """Get text from an element"""
        try:
            element = self.find_element(by, value)
            if element:
                return element.text
            return None
        except Exception as e:
            logger.error(f"Failed to get text: {str(e)}")
            return None
    
    def is_element_visible(self, by, value, timeout=5):
        """Check if element is visible"""
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, value))
            )
            return True
        except TimeoutException:
            return False
    
    def wait_for_url_contains(self, text, timeout=10):
        """Wait for URL to contain specific text"""
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.url_contains(text)
            )
            return True
        except TimeoutException:
            logger.error(f"URL did not contain: {text}")
            return False
    
    def get_current_url(self):
        """Get current URL"""
        try:
            return self.driver.current_url
        except Exception as e:
            logger.error(f"Failed to get current URL: {str(e)}")
            return None