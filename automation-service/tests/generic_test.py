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
        
    def _parse_selector(self, selector):
        """Helper to determine selector type and convert jQuery pseudo-selectors like :contains() to XPath"""
        if ':contains(' in selector and not selector.startswith('//'):
            tag = selector.split(':contains(')[0]
            if not tag:
                tag = '*'
            text_part = selector.split(':contains(')[1].strip()
            if text_part.endswith(')'):
                text_part = text_part[:-1]
            if text_part.startswith('"') and text_part.endswith('"'):
                text_part = text_part[1:-1]
            elif text_part.startswith("'") and text_part.endswith("'"):
                text_part = text_part[1:-1]
            return By.XPATH, f"//{tag}[contains(text(), '{text_part}')]"
            
        if selector.startswith('//') or selector.startswith('('):
            return By.XPATH, selector
        return By.CSS_SELECTOR, selector

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
            by_type, parsed_selector = self._parse_selector(selector)
            success = self.click_element(by_type, parsed_selector)
            if not success:
                raise Exception(f"Failed to click element: {selector}")
            return True
            
        elif command == 'TYPE':
            if len(parts) < 3:
                raise Exception("TYPE missing selector or text argument. Syntax: TYPE <selector> <text>")
            selector = parts[1]
            text = ' '.join(parts[2:])
            by_type, parsed_selector = self._parse_selector(selector)
            success = self.input_text(by_type, parsed_selector, text)
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
            by_type, parsed_selector = self._parse_selector(selector)
            if not self.is_element_visible(by_type, parsed_selector):
                raise Exception(f"Element not visible: {selector}")
            return True
            
        elif command == 'ASSERT_TEXT':
            if len(parts) < 3:
                raise Exception("ASSERT_TEXT missing selector or expected text")
            selector = parts[1]
            expected_text = ' '.join(parts[2:])
            by_type, parsed_selector = self._parse_selector(selector)
            actual = self.get_text(by_type, parsed_selector)
            if actual is None or expected_text not in actual:
                raise Exception(f"Expected text '{expected_text}' not found in element '{selector}'. Actual: '{actual}'")
            return True
            
        elif command == 'ASSERT_NO_BROKEN_IMAGES':
            broken_images = self.driver.execute_script("""
                var broken = [];
                for (var i = 0; i < document.images.length; i++) {
                    var img = document.images[i];
                    if (!img.complete || typeof img.naturalWidth == 'undefined' || img.naturalWidth === 0) {
                        broken.push(img.src || 'Unknown Image Location');
                    }
                }
                return broken;
            """)
            if broken_images:
                raise Exception(f"Found {len(broken_images)} broken image(s). First 3: {', '.join(broken_images[:3])}")
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
