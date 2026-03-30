import os
import logging
from datetime import datetime
from config.settings import Config

logger = logging.getLogger(__name__)

class TestHelpers:
    """Helper functions for test execution"""
    
    @staticmethod
    def take_screenshot(driver, test_case_id, execution_id):
        """Take a screenshot and save it"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"failure_{test_case_id}_{execution_id}_{timestamp}.png"
            filepath = os.path.join(Config.SCREENSHOT_PATH, filename)
            
            driver.save_screenshot(filepath)
            logger.info(f"Screenshot saved: {filename}")
            
            return filepath
            
        except Exception as e:
            logger.error(f"Failed to take screenshot: {str(e)}")
            return None
    
    @staticmethod
    def get_page_source(driver):
        """Get the current page source"""
        try:
            return driver.page_source
        except Exception as e:
            logger.error(f"Failed to get page source: {str(e)}")
            return None
    
    @staticmethod
    def get_console_logs(driver):
        """Get browser console logs"""
        try:
            logs = driver.get_log('browser')
            return logs
        except Exception as e:
            logger.error(f"Failed to get console logs: {str(e)}")
            return []
    
    @staticmethod
    def format_duration(seconds):
        """Format duration in seconds to readable format"""
        if seconds < 60:
            return f"{seconds:.2f}s"
        elif seconds < 3600:
            minutes = seconds // 60
            secs = seconds % 60
            return f"{int(minutes)}m {int(secs)}s"
        else:
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            return f"{int(hours)}h {int(minutes)}m"