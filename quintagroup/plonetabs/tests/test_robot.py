import robotsuite
import unittest2 as unittest

from plone.testing import layered

from quintagroup.plonetabs.tests.layer import TABS_ACCEPTANCE_TESTING


def test_suite():
    suite = unittest.TestSuite()
    suite.addTests([
        layered(robotsuite.RobotTestSuite("test_tabs.txt"),
                layer=TABS_ACCEPTANCE_TESTING),
    ])
    return suite
