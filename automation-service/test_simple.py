import logging
from utils.browser import BrowserManager
from tests.sample_tests import GoogleSearchTest

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_simple():
    """Simple test to verify automation works"""
    driver = None
    try:
        logger.info("="*60)
        logger.info("Starting Simple Automation Test")
        logger.info("="*60)
        
        # Create driver
        logger.info("Creating Chrome driver...")
        driver = BrowserManager.create_driver()
        logger.info("✅ Driver created successfully")
        
        # Run Google search test
        logger.info("Running Google Search test...")
        test = GoogleSearchTest(driver)
        success, error = test.execute()
        
        if success:
            logger.info("✅ TEST PASSED!")
            return 0
        else:
            logger.error(f"❌ TEST FAILED: {error}")
            return 1
            
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        return 1
    finally:
        if driver:
            driver.quit()
            logger.info("Driver closed")

if __name__ == "__main__":
    exit_code = test_simple()
    exit(exit_code)