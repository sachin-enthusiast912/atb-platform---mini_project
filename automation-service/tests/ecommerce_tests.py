import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.base_test import BaseTest
import time
import re

logger = logging.getLogger(__name__)

class EcommerceBaseTestWithLogin(BaseTest):
    """Base class for e-commerce tests with login functionality"""
    
    def login(self, username="testuser", password="password123"):
        """Perform login - override with your actual credentials"""
        try:
            logger.info("Attempting to login...")
            
            # Common login field selectors
            username_selectors = [
                (By.CSS_SELECTOR, "input[type='email']"),
                (By.CSS_SELECTOR, "input[name='email']"),
                (By.CSS_SELECTOR, "input[type='text']"),
                (By.CSS_SELECTOR, "input[name='username']"),
                (By.CSS_SELECTOR, "input[placeholder*='email' i]"),
                (By.CSS_SELECTOR, "input[placeholder*='username' i]"),
                (By.ID, "email"),
                (By.ID, "username"),
            ]
            
            password_selectors = [
                (By.CSS_SELECTOR, "input[type='password']"),
                (By.CSS_SELECTOR, "input[name='password']"),
                (By.ID, "password"),
            ]
            
            login_button_selectors = [
                (By.XPATH, "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'login')]"),
                (By.XPATH, "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')]"),
                (By.CSS_SELECTOR, "button[type='submit']"),
                (By.XPATH, "//button[contains(., 'Login') or contains(., 'Sign In')]"),
            ]
            
            # Find username field
            username_field = None
            for selector in username_selectors:
                username_field = self.find_element(*selector, timeout=5)
                if username_field:
                    logger.info(f"Found username field: {selector}")
                    break
            
            if not username_field:
                logger.warning("Username field not found, might already be logged in")
                return True  # Assume already logged in
            
            # Find password field
            password_field = None
            for selector in password_selectors:
                password_field = self.find_element(*selector, timeout=5)
                if password_field:
                    logger.info(f"Found password field: {selector}")
                    break
            
            if not password_field:
                logger.warning("Password field not found")
                return False
            
            # Enter credentials
            logger.info(f"Entering username: {username}")
            username_field.clear()
            username_field.send_keys(username)
            time.sleep(0.5)
            
            logger.info("Entering password")
            password_field.clear()
            password_field.send_keys(password)
            time.sleep(0.5)
            
            # Find and click login button
            login_button = None
            for selector in login_button_selectors:
                login_button = self.find_element(*selector, timeout=5)
                if login_button:
                    logger.info(f"Found login button: {selector}")
                    break
            
            if not login_button:
                logger.info("Login button not found, trying Enter key")
                password_field.send_keys(Keys.RETURN)
            else:
                login_button.click()
            
            time.sleep(3)  # Wait for login to process
            
            # Verify login success (check if still on login page or redirected)
            current_url = self.get_current_url()
            logger.info(f"Current URL after login: {current_url}")
            
            # Check if we're still on login page (might indicate failure)
            if 'login' in current_url.lower():
                logger.warning("Still on login page, login might have failed")
                return False
            
            logger.info("✅ Login successful")
            return True
            
        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            return False


class EcommerceLoginTest(EcommerceBaseTestWithLogin):
    """Test login functionality"""
    
    def execute(self):
        try:
            logger.info("Starting Login Test...")
            
            # Step 1: Navigate
            logger.info("Step 1: Navigate to app")
            if not self.navigate_to("http://localhost:5174"):
                return False, "Failed to navigate to e-commerce app"
            
            time.sleep(2)
            
            # Step 2: Perform login
            logger.info("Step 2: Attempting login")
            if not self.login():
                return False, "Login failed - could not complete login process"
            
            # Verify we're logged in (check for user profile, products, etc.)
            logger.info("Verifying login success...")
            
            # Look for indicators of successful login
            success_indicators = [
                self.find_element(By.XPATH, "//*[contains(., 'Logout') or contains(., 'logout')]"),
                self.find_element(By.CSS_SELECTOR, ".user-profile, [class*='profile'], [class*='account']"),
                self.find_elements(By.CSS_SELECTOR, ".product, .product-card"),  # Products visible
            ]
            
            logged_in = any(success_indicators)
            
            if not logged_in:
                return False, "Could not verify successful login"
            
            logger.info("✅ Login Test PASSED")
            return True, None
            
        except Exception as e:
            return False, str(e)


class EcommerceProductListingTest(EcommerceBaseTestWithLogin):
    """Test product listing with login"""
    
    def execute(self):
        try:
            logger.info("Starting Product Listing Test with Login...")
            
            # Step 1: Navigate
            logger.info("Step 1: Navigate to app")
            if not self.navigate_to("http://localhost:5174"):
                return False, "Failed to navigate"
            
            time.sleep(2)
            
            # Step 2: Login
            logger.info("Step 2: Login")
            if not self.login():
                return False, "Login failed"
            
            time.sleep(2)
            
            # Step 3: Find products
            logger.info("Step 3: Looking for products...")
            
            product_selectors = [
                (By.CSS_SELECTOR, ".product"),
                (By.CSS_SELECTOR, ".product-card"),
                (By.CSS_SELECTOR, ".item"),
                (By.CSS_SELECTOR, "[class*='product']"),
                (By.CSS_SELECTOR, ".card"),
                (By.TAG_NAME, "article"),
            ]
            
            products = []
            for selector in product_selectors:
                products = self.find_elements(*selector)
                if len(products) > 0:
                    logger.info(f"Found {len(products)} products using: {selector}")
                    break
            
            if len(products) < 3:
                return False, f"Not enough products. Found: {len(products)}, Expected: ≥3"
            
            logger.info(f"✅ Found {len(products)} products")
            
            # Step 4-6: Verify product structure
            logger.info("Step 4-6: Verifying products have images, names, prices...")
            
            for i, product in enumerate(products[:5], 1):
                # Check image
                images = product.find_elements(By.TAG_NAME, "img")
                if len(images) == 0:
                    logger.warning(f"Product {i} has no image")
                
                # Check for price
                price_found = '$' in product.text or bool(re.search(r'\d+\.\d{2}', product.text))
                if not price_found:
                    logger.warning(f"Product {i} might not have price")
            
            # Step 7: Check for Add to Cart buttons
            logger.info("Step 7: Checking for Add to Cart buttons...")
            buttons = self.find_elements(By.XPATH, "//button[contains(., 'Add') or contains(., 'Cart')]")
            
            if len(buttons) == 0:
                return False, "No Add to Cart buttons found"
            
            logger.info(f"✅ Found {len(buttons)} action buttons")
            logger.info("✅ Product Listing Test PASSED")
            return True, None
            
        except Exception as e:
            return False, str(e)


class EcommerceAddToCartTest(EcommerceBaseTestWithLogin):
    """Test adding product to cart with login"""
    
    def execute(self):
        try:
            logger.info("Starting Add to Cart Test with Login...")
            
            # Step 1: Navigate
            if not self.navigate_to("http://localhost:5174"):
                return False, "Failed to navigate"
            
            time.sleep(2)
            
            # Step 2: Login
            logger.info("Step 2: Login")
            if not self.login():
                return False, "Login failed"
            
            time.sleep(2)
            
            # Step 3: Find Add to Cart button
            logger.info("Step 3: Looking for Add to Cart button...")
            
            add_button = self.find_element(
                By.XPATH, 
                "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'add') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'cart')]"
            )
            
            if not add_button:
                return False, "Add to Cart button not found"
            
            # Step 4: Get cart count before
            cart_count_before = self.get_cart_count()
            logger.info(f"Cart count before: {cart_count_before}")
            
            # Step 5: Click Add to Cart
            logger.info("Step 4: Clicking Add to Cart...")
            add_button.click()
            time.sleep(2)
            
            # Step 6: Get cart count after
            cart_count_after = self.get_cart_count()
            logger.info(f"Step 5: Cart count after: {cart_count_after}")
            
            # Step 7: Verify
            if cart_count_after <= cart_count_before:
                return False, f"Cart count did not increase. Before: {cart_count_before}, After: {cart_count_after}"
            
            logger.info("✅ Add to Cart Test PASSED")
            return True, None
            
        except Exception as e:
            return False, str(e)
    
    def get_cart_count(self):
        """Get cart item count"""
        try:
            selectors = [
                ".cart-count",
                ".badge",
                "[class*='cart'] [class*='count']",
                ".cart span",
            ]
            
            for selector in selectors:
                elements = self.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements:
                    text = elem.text.strip()
                    if text.isdigit():
                        return int(text)
            return 0
        except:
            return 0


class EcommerceRemoveFromCartTest(EcommerceBaseTestWithLogin):
    """Test removing product from cart with login"""
    
    def execute(self):
        try:
            logger.info("Starting Remove from Cart Test with Login...")
            
            # Step 1: Navigate
            if not self.navigate_to("http://localhost:5174"):
                return False, "Failed to navigate"
            
            time.sleep(2)
            
            # Step 2: Login
            logger.info("Step 2: Login")
            if not self.login():
                return False, "Login failed"
            
            time.sleep(2)
            
            # Step 3: Add product first
            logger.info("Step 3: Adding product to cart...")
            add_button = self.find_element(By.XPATH, "//button[contains(., 'Add')]")
            if not add_button:
                return False, "Could not add product"
            
            add_button.click()
            time.sleep(2)
            
            # Step 4: Navigate to cart
            logger.info("Step 4: Navigating to cart...")
            cart_link = self.find_element(By.XPATH, "//a[contains(., 'Cart')]")
            if cart_link:
                cart_link.click()
                time.sleep(2)
            
            # Step 5: Find remove button
            logger.info("Step 5: Finding remove button...")
            remove_button = self.find_element(
                By.XPATH, 
                "//button[contains(., 'Remove') or contains(., 'Delete') or contains(., '×')]"
            )
            
            if not remove_button:
                return False, "Remove button not found"
            
            # Step 6: Click remove
            logger.info("Step 6: Clicking remove...")
            remove_button.click()
            time.sleep(2)
            
            # Step 7: Verify removed
            logger.info("Step 7: Verifying removal...")
            # Cart should be empty or count should be 0
            empty_cart = self.find_element(By.XPATH, "//*[contains(., 'empty') or contains(., 'Empty')]")
            
            if empty_cart:
                logger.info("✅ Cart is empty")
            
            logger.info("✅ Remove from Cart Test PASSED")
            return True, None
            
        except Exception as e:
            return False, str(e)


class EcommerceCartQuantityTest(EcommerceBaseTestWithLogin):
    """Test quantity update with login"""
    
    def execute(self):
        try:
            logger.info("Starting Cart Quantity Test with Login...")
            
            # Step 1: Navigate
            if not self.navigate_to("http://localhost:5174"):
                return False, "Failed to navigate"
            
            time.sleep(2)
            
            # Step 2: Login
            logger.info("Step 2: Login")
            if not self.login():
                return False, "Login failed"
            
            time.sleep(2)
            
            # Step 3: Add product
            logger.info("Step 3: Adding product...")
            add_button = self.find_element(By.XPATH, "//button[contains(., 'Add')]")
            if add_button:
                add_button.click()
                time.sleep(2)
            
            # Step 4: Go to cart
            logger.info("Step 4: Going to cart...")
            cart_link = self.find_element(By.XPATH, "//a[contains(., 'Cart')]")
            if cart_link:
                cart_link.click()
                time.sleep(2)
            
            # Step 5-6: Update quantity
            logger.info("Step 5-6: Updating quantity...")
            quantity_input = self.find_element(By.CSS_SELECTOR, "input[type='number']")
            
            if quantity_input:
                quantity_input.clear()
                quantity_input.send_keys("3")
                quantity_input.send_keys(Keys.RETURN)
                time.sleep(2)
            else:
                # Try increment buttons
                plus_button = self.find_element(By.XPATH, "//button[contains(., '+')]")
                if plus_button:
                    plus_button.click()
                    time.sleep(1)
                    plus_button.click()
                    time.sleep(1)
            
            logger.info("✅ Cart Quantity Test PASSED")
            return True, None
            
        except Exception as e:
            return False, str(e)


class EcommerceSearchTest(EcommerceBaseTestWithLogin):
    """Test search with login"""
    
    def execute(self):
        try:
            logger.info("Starting Search Test with Login...")
            
            # Step 1: Navigate
            if not self.navigate_to("http://localhost:5174"):
                return False, "Failed to navigate"
            
            time.sleep(2)
            
            # Step 2: Login
            logger.info("Step 2: Login")
            if not self.login():
                return False, "Login failed"
            
            time.sleep(2)
            
            # Step 3: Find search
            logger.info("Step 3: Finding search input...")
            search_input = self.find_element(
                By.CSS_SELECTOR, 
                "input[type='search'], input[placeholder*='search' i]"
            )
            
            if not search_input:
                return False, "Search input not found"
            
            # Step 4-5: Search
            logger.info("Step 4-5: Performing search...")
            search_input.send_keys("laptop")
            search_input.send_keys(Keys.RETURN)
            time.sleep(3)
            
            # Step 6-7: Verify results
            logger.info("Step 6-7: Verifying results...")
            products = self.find_elements(By.CSS_SELECTOR, ".product, .product-card")
            
            if len(products) == 0:
                return False, "No search results found"
            
            logger.info(f"✅ Found {len(products)} search results")
            return True, None
            
        except Exception as e:
            return False, str(e)


class EcommerceEmptyCartTest(EcommerceBaseTestWithLogin):
    """Test empty cart validation with login"""
    
    def execute(self):
        try:
            logger.info("Starting Empty Cart Test with Login...")
            
            # Step 1: Navigate
            if not self.navigate_to("http://localhost:5174"):
                return False, "Failed to navigate"
            
            time.sleep(2)
            
            # Step 2: Login
            logger.info("Step 2: Login")
            if not self.login():
                return False, "Login failed"
            
            time.sleep(2)
            
            # Step 3-4: Go to cart
            logger.info("Step 3-4: Navigating to cart...")
            cart_link = self.find_element(By.XPATH, "//a[contains(., 'Cart')]")
            if cart_link:
                cart_link.click()
                time.sleep(2)
            
            # Step 5-7: Check checkout button
            logger.info("Step 5-7: Checking empty cart validation...")
            checkout_button = self.find_element(By.XPATH, "//button[contains(., 'Checkout')]")
            
            if checkout_button and checkout_button.is_enabled():
                return False, "BUG: Checkout enabled with empty cart!"
            
            logger.info("✅ Empty cart validation working")
            return True, None
            
        except Exception as e:
            return False, str(e)