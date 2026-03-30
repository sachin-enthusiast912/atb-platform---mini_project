import logging
from selenium.webdriver.common.by import By
from tests.base_test import BaseTest
import time

logger = logging.getLogger(__name__)

class GoogleSearchTest(BaseTest):
    """Google search test - for testing the platform"""
    
    def execute(self):
        """Execute Google search test"""
        try:
            logger.info("Starting Google Search Test...")
            
            # Step 1: Navigate to Google
            logger.info("Step 1: Navigate to Google")
            if not self.navigate_to("https://www.google.com"):
                return False, "Failed to navigate to Google"
            
            time.sleep(2)
            
            # Step 2: Find search box
            logger.info("Step 2: Find search box")
            search_box = self.find_element(By.NAME, "q", timeout=10)
            if not search_box:
                return False, "Search box not found"
            
            # Step 3: Enter search query
            logger.info("Step 3: Enter search query")
            search_box.send_keys("Selenium WebDriver")
            time.sleep(1)
            
            # Step 4: Submit search
            logger.info("Step 4: Submit search")
            search_box.submit()
            time.sleep(3)
            
            # Step 5: Verify results
            logger.info("Step 5: Verify results")
            results = self.find_elements(By.CSS_SELECTOR, "h3")
            
            if len(results) < 5:
                return False, f"Not enough search results. Found: {len(results)}, Expected: at least 5"
            
            logger.info(f"Found {len(results)} search results")
            logger.info("Google Search Test PASSED")
            return True, None
            
        except Exception as e:
            error_msg = f"Google search test failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg