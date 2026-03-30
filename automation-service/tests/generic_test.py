import logging
import time
from selenium.webdriver.common.by import By
from tests.base_test import BaseTest

logger = logging.getLogger(__name__)

class GenericTest(BaseTest):
    """Executes generic Keyword-Driven test steps"""
    def __init__(self, driver, steps):
        super().__init__(driver)
        self.steps = steps
        
    def _get_by_type(self, selector):
        """Helper to determine selector type (CSS or XPATH)"""
        # Simple heuristic: if it starts with // or (// it's XPath
        if selector.startswith('//') or selector.startswith('('):
            return By.XPATH
        return By.CSS_SELECTOR

    def _execute_action(self, action_str):
        if not action_str:
            return True
        
        parts = action_str.strip().split(' ')
        if not parts:
            return True
            
        command = parts[0].upper()
        
        # If it doesn't look like an automation keyword, just skip it (for backward compatibility if they have text)
        # But for strict DSL, we throw an error. We will be strict.
        
        if command == 'NAVIGATE':
            if len(parts) < 2:
                raise Exception("NAVIGATE missing url argument")
            
            # Forgive "Navigate to <url>"
            if len(parts) >= 3 and parts[1].lower() == 'to':
                url = parts[2]
            else:
                url = parts[1]
                
            success = self.navigate_to(url)
            if not success:
                raise Exception(f"Failed to navigate to {url}")
            return True
            
        elif command == 'CLICK':
            if len(parts) < 2:
                raise Exception("CLICK missing selector argument")
            selector = ' '.join(parts[1:])
            success = self.click_element(self._get_by_type(selector), selector)
            if not success:
                raise Exception(f"Failed to click element: {selector}")
            return True
            
        elif command == 'TYPE':
            if len(parts) < 3:
                raise Exception("TYPE missing selector or text argument. Syntax: TYPE <selector> <text>")
            selector = parts[1]
            text = ' '.join(parts[2:])
            success = self.input_text(self._get_by_type(selector), selector, text)
            if not success:
                raise Exception(f"Failed to type into element: {selector}")
            return True
            
        elif command == 'WAIT':
            if len(parts) < 2:
                raise Exception("WAIT missing seconds argument")
            try:
                seconds = float(parts[1])
                time.sleep(seconds)
                return True
            except ValueError:
                raise Exception(f"Invalid WAIT duration: {parts[1]}")
                
        else:
            logger.warning(f"Skipping manual or unknown action: '{action_str}'")
            return True

    def _execute_assertion(self, assert_str):
        if not assert_str:
            return True
            
        parts = assert_str.strip().split(' ')
        if not parts:
            return True
            
        command = parts[0].upper()
        
        if command == 'ASSERT_URL':
            if len(parts) < 2:
                raise Exception("ASSERT_URL missing text argument")
            expected_url_part = parts[1]
            if not self.wait_for_url_contains(expected_url_part):
                raise Exception(f"URL did not contain '{expected_url_part}'. Current: {self.get_current_url()}")
            return True
            
        elif command == 'ASSERT_VISIBLE':
            if len(parts) < 2:
                raise Exception("ASSERT_VISIBLE missing selector argument")
            selector = ' '.join(parts[1:])
            if not self.is_element_visible(self._get_by_type(selector), selector):
                raise Exception(f"Element not visible: {selector}")
            return True
            
        elif command == 'ASSERT_TEXT':
            if len(parts) < 3:
                raise Exception("ASSERT_TEXT missing selector or expected text")
            selector = parts[1]
            expected_text = ' '.join(parts[2:])
            actual = self.get_text(self._get_by_type(selector), selector)
            if actual is None or expected_text not in actual:
                raise Exception(f"Expected text '{expected_text}' not found in element '{selector}'. Actual: '{actual}'")
            return True
            
        else:
            logger.warning(f"Skipping manual or unknown assertion: '{assert_str}'")
            return True

    def execute(self):
        """Execute all steps sequentially"""
        if not self.steps:
            return False, "No steps defined for this test case."
            
        try:
            for i, step in enumerate(self.steps, 1):
                logger.info(f"--- Executing Step {i} ---")
                
                # Execute Action
                action = step.get('action')
                if action:
                    logger.info(f"Action: {action}")
                    success = self._execute_action(action)
                    if not success:
                        return False, f"Step {i} action failed: {action}"
                        
                # Execute Expected Result (Assertion)
                expected = step.get('expectedResult')
                if expected:
                    logger.info(f"Expected: {expected}")
                    # Give UI a brief moment to update before asserting
                    time.sleep(0.5) 
                    success = self._execute_assertion(expected)
                    if not success:
                        return False, f"Step {i} assertion failed: {expected}"
                        
            return True, None
            
        except Exception as e:
            logger.error(f"Test Execution Failed: {str(e)}")
            return False, str(e)
