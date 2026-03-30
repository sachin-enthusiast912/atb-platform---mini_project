import logging
from selenium.webdriver.common.by import By
from tests.base_test import BaseTest
from config.settings import Config
import time

logger = logging.getLogger(__name__)

class LoginTest(BaseTest):
    """Login functionality test"""
    
    def __init__(self, driver):
        super().__init__(driver)
        self.app_url = Config.TEST_APP_URL
    
    def execute(self):
        """
        Execute login test
        Returns: (success: bool, error_message: str)
        """
        try:
            logger.info("Starting Login Test...")
            
            # Step 1: Navigate to login page
            logger.info("Step 1: Navigate to login page")
            if not self.navigate_to(f"{self.app_url}/login"):
                return False, "Failed to navigate to login page"
            
            time.sleep(2)  # Wait for page to load
            
            # Step 2: Verify login form exists
            logger.info("Step 2: Verify login form exists")
            email_field = self.find_element(By.ID, "email", timeout=5)
            if not email_field:
                email_field = self.find_element(By.NAME, "email", timeout=5)
            
            if not email_field:
                return False, "Login form not found on page"
            
            # Step 3: Enter email
            logger.info("Step 3: Enter email")
            if not self.input_text(By.ID, "email", "test@example.com"):
                if not self.input_text(By.NAME, "email", "test@example.com"):
                    return False, "Failed to enter email"
            
            time.sleep(1)
            
            # Step 4: Enter password
            logger.info("Step 4: Enter password")
            if not self.input_text(By.ID, "password", "password123"):
                if not self.input_text(By.NAME, "password", "password123"):
                    return False, "Failed to enter password"
            
            time.sleep(1)
            
            # Step 5: Click login button
            logger.info("Step 5: Click login button")
            login_button = self.find_element(By.CSS_SELECTOR, 'button[type="submit"]', timeout=5)
            
            if not login_button:
                login_button = self.find_element(By.XPATH, "//button[contains(text(), 'Login')]", timeout=5)
            
            if not login_button:
                return False, "Login button not found"
            
            login_button.click()
            time.sleep(3)  # Wait for login to process
            
            # Step 6: Verify redirect to dashboard
            logger.info("Step 6: Verify redirect to dashboard")
            current_url = self.get_current_url()
            
            if not current_url:
                return False, "Failed to get current URL"
            
            # Check if redirected (URL changed from /login)
            if 'login' in current_url.lower():
                # Still on login page - check for error message
                error_element = self.find_element(By.CLASS_NAME, "error", timeout=2)
                if error_element:
                    error_text = error_element.text
                    return False, f"Login failed with error: {error_text}"
                else:
                    return False, "Login failed - still on login page with no error message"
            
            # Login successful - should be on dashboard or home page
            logger.info(f"Login successful! Current URL: {current_url}")
            
            # Optional: Verify user is logged in by checking for user element
            # This depends on your frontend implementation
            
            logger.info("Login Test PASSED")
            return True, None
            
        except Exception as e:
            error_msg = f"Login test failed with exception: {str(e)}"
            logger.error(error_msg)
            return False, error_msg