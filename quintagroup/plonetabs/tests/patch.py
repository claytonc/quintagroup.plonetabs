import os
import Selenium2Library
from Selenium2Library import Selenium2Library as S2L
from selenium import webdriver

ROOT_DIR = os.path.dirname(Selenium2Library.__file__)
FIREFOX_PROFILE_DIR = os.path.join(ROOT_DIR, 'resources', 'firefoxprofile')


def ff_without_javascripts(self, remote, desired_capabilites, profile_dir):
    if not profile_dir: profile_dir = FIREFOX_PROFILE_DIR
    profile = webdriver.FirefoxProfile(profile_dir)
    profile.set_preference("javascript.enabled", False)
    browser = webdriver.Firefox(firefox_profile=profile)
    return browser

S2L._make_ff = ff_without_javascripts