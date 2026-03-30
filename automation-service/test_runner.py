import sys
import logging
import time
from datetime import datetime
from utils.browser import BrowserManager
from utils.api_client import APIClient
from utils.helpers import TestHelpers
from tests.login_test import LoginTest
from tests.sample_tests import GoogleSearchTest
from config.settings import Config

# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"{Config.LOG_PATH}/test_execution_{datetime.now().strftime('%Y%m%d')}.log", encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class TestRunner:
    """Main test runner class"""
    
    def __init__(self, test_case_id, execution_id):
        self.test_case_id = test_case_id
        self.execution_id = execution_id
        self.driver = None
        self.api_client = APIClient()
        self.start_time = None
        self.end_time = None
    
    def run(self):
        """Run the test"""
        logger.info("="*60)
        logger.info(f"Starting Test Execution")
        logger.info(f"Test Case ID: {self.test_case_id}")
        logger.info(f"Execution ID: {self.execution_id}")
        logger.info("="*60)
        
        try:
            # Record start time
            self.start_time = time.time()
            
            # Create browser driver
            logger.info("Initializing browser...")
            self.driver = BrowserManager.create_driver()
            
            # Get test case details (dynamic test selection)
            test_case = self.api_client.get_test_case(self.test_case_id)
            
            if not test_case:
                raise Exception(f"Failed to fetch test case {self.test_case_id} from API")
            
            logger.info("Executing test dynamically...")
            automation_script = test_case.get('automationScript')
            
            if automation_script:
                logger.info(f"Running explicit script: {automation_script}")
                try:
                    import importlib
                    module_name = automation_script.replace('.py', '').replace('/', '.')
                    module = importlib.import_module(f"tests.{module_name}")
                    
                    # Find test class
                    from tests.base_test import BaseTest
                    test_class = None
                    for item_name in dir(module):
                        item = getattr(module, item_name)
                        if isinstance(item, type) and issubclass(item, BaseTest) and item is not BaseTest:
                            test_class = item
                            break
                            
                    if not test_class:
                        raise Exception(f"No valid test class found in {automation_script}")
                        
                    test = test_class(self.driver)
                    success, error_message = test.execute()
                except Exception as e:
                    logger.error(f"Error loading script {automation_script}: {str(e)}")
                    raise Exception(f"Failed to load automation script {automation_script}: {str(e)}")
            else:
                # Use Generic Test Executor
                steps = test_case.get('steps', [])
                if not steps:
                    raise Exception("Test case has no automationScript and no steps to execute.")
                
                logger.info(f"Running Generic Test Executor with {len(steps)} steps")
                from tests.generic_test import GenericTest
                test = GenericTest(self.driver, steps)
                success, error_message = test.execute()
            
            # Record end time
            self.end_time = time.time()
            duration = self.end_time - self.start_time
            
            # Handle test result
            if success:
                logger.info(f"Test PASSED in {duration:.2f} seconds")
                self.api_client.update_execution(
                    self.execution_id,
                    'Passed',
                    duration=duration
                )
                return 0  # Success exit code
            else:
                logger.error(f"Test FAILED: {error_message}")
                
                # Take screenshot
                screenshot_path = None
                if Config.SCREENSHOT_ON_FAILURE:
                    screenshot_path = TestHelpers.take_screenshot(
                        self.driver,
                        self.test_case_id,
                        self.execution_id
                    )
                
                # Update execution
                self.api_client.update_execution(
                    self.execution_id,
                    'Failed',
                    error_message=error_message,
                    screenshot=screenshot_path,
                    duration=duration
                )
                
                # Create bug (this will be done by backend)
                # The backend will auto-create bug when it receives the failed status
                
                return 1  # Failure exit code
                
        except Exception as e:
            logger.error(f"Test execution failed with exception: {str(e)}")
            
            # Calculate duration
            if self.start_time:
                duration = time.time() - self.start_time
            else:
                duration = 0
            
            # Take screenshot
            screenshot_path = None
            if self.driver and Config.SCREENSHOT_ON_FAILURE:
                try:
                    screenshot_path = TestHelpers.take_screenshot(
                        self.driver,
                        self.test_case_id,
                        self.execution_id
                    )
                except:
                    pass
            
            # Update execution
            self.api_client.update_execution(
                self.execution_id,
                'Error',
                error_message=str(e),
                screenshot=screenshot_path,
                duration=duration
            )
            
            return 1  # Failure exit code
            
        finally:
            # Cleanup
            if self.driver:
                BrowserManager.quit_driver(self.driver)
            
            logger.info("="*60)
            logger.info("Test execution completed")
            logger.info("="*60)


if __name__ == "__main__":
    # Get arguments
    if len(sys.argv) < 3:
        print("Usage: python test_runner.py <test_case_id> <execution_id>")
        sys.exit(1)
    
    test_case_id = sys.argv[1]
    execution_id = sys.argv[2]
    
    # Run test
    runner = TestRunner(test_case_id, execution_id)
    exit_code = runner.run()
    
    # Output result for Node.js to parse
    print(f"\nRESULT_EXIT_CODE:{exit_code}")
    
    sys.exit(exit_code)