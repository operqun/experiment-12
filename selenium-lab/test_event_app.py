import os                                                   # os: read the BASE_URL environment variable
import time                                                 # time: current time, used to make unique emails
import pytest                                               # pytest: test framework (fixtures, test discovery)
from selenium import webdriver                              # webdriver: controls the Chrome browser
from selenium.webdriver.common.by import By                 # By: locator types (ID, TAG_NAME, CSS_SELECTOR, ...)
from selenium.webdriver.support.ui import Select, WebDriverWait  # Select: drop-downs; WebDriverWait: explicit waits
from selenium.webdriver.support import expected_conditions as EC  # EC: ready-made wait conditions

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")  # Address of the app; default is the Docker container
UNIQUE = str(int(time.time()))                              # Seconds since 1970 as text, so emails differ in every run


@pytest.fixture(scope="module")                             # Fixture shared by all tests in this file (one browser)
def driver():                                               # Fixture name; tests receive it by asking for "driver"
    drv = webdriver.Chrome()                                # Start Chrome
    drv.set_window_size(1280, 1050)                         # Set the window size in pixels
    yield drv                                               # Give the browser to the tests; pause here until they finish
    drv.quit()                                              # After all tests: close the browser


@pytest.fixture                                             # Fixture run before EACH test that asks for "page"
def page(driver):                                           # Uses the driver fixture above
    driver.get(BASE_URL)                                    # Open the application home page
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "regForm")))  # Wait up to 10 s for the form
    return driver                                           # Give the ready page to the test


def fill_form(d, name="", email="", phone="", college="", event=None):  # Helper: fill the form and click Register
    d.find_element(By.ID, "name").send_keys(name)          # Type the name
    d.find_element(By.ID, "email").send_keys(email)        # Type the email
    d.find_element(By.ID, "phone").send_keys(phone)        # Type the mobile number
    d.find_element(By.ID, "college").send_keys(college)    # Type the college
    if event:                                               # Only if an event name was given...
        Select(d.find_element(By.ID, "event")).select_by_visible_text(event)  # ...choose it in the drop-down
    d.find_element(By.ID, "registerBtn").click()           # Click the Register button


def text_of(d, element_id):                                 # Helper: wait for a message and return its text
    WebDriverWait(d, 10).until(lambda drv: drv.find_element(By.ID, element_id).text != "")  # Wait until the element shows text
    return d.find_element(By.ID, element_id).text          # Return that text


def test_tc01_page_loads(page):                             # TC01: page opens correctly
    assert page.title == "TechFest 2026 - Registration"     # Tab title must match
    assert page.find_element(By.TAG_NAME, "h1").text == "TechFest 2026"  # Main heading must match


def test_tc02_form_fields_present(page):                    # TC02: all form controls are visible
    for field in ["name", "email", "phone", "college", "event", "registerBtn"]:  # Loop over the element ids
        assert page.find_element(By.ID, field).is_displayed()  # Each element must be displayed


def test_tc03_health_endpoint(driver):                      # TC03: health API works
    driver.get(BASE_URL + "/health")                        # Open the /health URL directly
    assert '"status":"UP"' in driver.find_element(By.TAG_NAME, "body").text  # Page must contain "status":"UP"


def test_tc04_empty_form_rejected(page):                    # TC04: empty form is rejected
    page.find_element(By.ID, "registerBtn").click()         # Click Register with nothing filled
    assert text_of(page, "error") == "Name and College are required."  # Expected error message


def test_tc05_invalid_email(page):                          # TC05: wrong email format
    fill_form(page, "Ravi Kumar", "ravi.gmail.com", "9876543210", "ABC Engineering College", "Hackathon")  # Email has no @
    assert text_of(page, "error") == "Please enter a valid email address."  # Expected error message


def test_tc06_invalid_phone(page):                          # TC06: wrong mobile number
    fill_form(page, "Ravi Kumar", "ravi@gmail.com", "12345", "ABC Engineering College", "Hackathon")  # Only 5 digits
    assert text_of(page, "error") == "Mobile number must be 10 digits starting with 6-9."  # Expected error message


def test_tc07_event_not_selected(page):                     # TC07: no event chosen
    fill_form(page, "Ravi Kumar", "ravi@gmail.com", "9876543210", "ABC Engineering College")  # event left out
    assert text_of(page, "error") == "Please select an event."  # Expected error message


def test_tc08_valid_registration(page):                     # TC08: successful registration
    before = int(page.find_element(By.ID, "count").text)    # Remember the participant count before registering
    fill_form(page, "Ravi Kumar", f"ravi{UNIQUE}@gmail.com", "9876543210",
              "ABC Engineering College", "Hackathon")       # Submit valid data with a unique email
    assert text_of(page, "success") == "Thank you Ravi Kumar! You are registered for Hackathon."  # Success message
    WebDriverWait(page, 10).until(
        lambda d: int(d.find_element(By.ID, "count").text) == before + 1)  # Wait until the count goes up by 1
    last_row = page.find_elements(By.CSS_SELECTOR, "#regTable tbody tr")[-1]  # Take the last row of the table
    assert "Ravi Kumar" in last_row.text and "Hackathon" in last_row.text  # It must show the new participant


def test_tc09_duplicate_email_rejected(page):               # TC09: same email cannot register twice
    fill_form(page, "Ravi Kumar", f"ravi{UNIQUE}@gmail.com", "9876543210",
              "ABC Engineering College", "Hackathon")       # Submit the email used in TC08 again
    assert text_of(page, "error") == "This email is already registered."  # Server returns 409 with this message


def test_tc10_clear_button(page):                           # TC10: Clear button empties the form
    page.find_element(By.ID, "name").send_keys("Test User")  # Type something in the name box
    page.find_element(By.CSS_SELECTOR, "button.reset").click()  # Click the Clear (reset) button
    assert page.find_element(By.ID, "name").get_attribute("value") == ""  # Name box must now be empty
