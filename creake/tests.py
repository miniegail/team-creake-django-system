<<<<<<< HEAD
# ============================================
# IMPORTS
# Standard libraries and Selenium components
# ============================================
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


# ============================================
# TEST CLASS
# Contains all test methods for the homepage
# ============================================
class HomepageTest(unittest.TestCase):

    # ============================================
    # SETUP METHOD
    # Runs before every test method automatically
    # Sets up the Brave browser and opens it
    # ============================================
    def setUp(self):

        # Configure Brave browser options
        options = Options()

        # Point Selenium to the Brave browser executable
        options.binary_location = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

        # Optional: run headless (no browser window opens)
        # options.add_argument("--headless")

        # Initialize the Chrome WebDriver using ChromeDriverManager
        # ChromeDriverManager automatically downloads the correct driver version
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options
        )

        # Set implicit wait — WebDriver will wait up to 10 seconds
        # before throwing an error if an element is not found
        self.driver.implicitly_wait(10)

        # Define the base URL of the Django development server
        self.base_url = "http://127.0.0.1:8000"

    # ============================================
    # TEST METHOD
    # Tests that the homepage h1 element exists
    # and contains the correct text
    # ============================================
    def test_main_heading_text(self):

        # Step 1: Navigate to the Django homepage
        self.driver.get(self.base_url)

        # Step 2: Use Explicit Wait to locate the <h1 id="main-heading"> element
        # This waits until the element is visible on the page before proceeding
        heading = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "main-heading"))
        )

        # Step 3: Get the actual text content of the h1 element
        actual_text = heading.text

        # Step 4: Define the expected text
        expected_text = "Welcome to My Site!"

        # Step 5: Assert that the actual text matches the expected text exactly
        # If they don't match, the test will fail and show both values
        self.assertEqual(
            actual_text,
            expected_text,
            f"Expected heading text: '{expected_text}' but got: '{actual_text}'"
        )

    # ============================================
    # TEARDOWN METHOD
    # Runs after every test method automatically
    # Closes the browser and cleans up resources
    # ============================================
    def tearDown(self):

        # Close the browser window
        self.driver.quit()


# ============================================
# ENTRY POINT
# Runs the test when the script is executed
# directly from the command line
# ============================================
if __name__ == "__main__":
    unittest.main()
=======
>>>>>>> a53e65880afd6fb6aedbac40105c4b08ef7a677c
