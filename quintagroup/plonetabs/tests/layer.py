from plone.testing import z2
from plone.app.testing import IntegrationTesting, FunctionalTesting
from plone.app.testing import PLONE_FIXTURE
from plone.app.testing import applyProfile
from plone.app.testing import PloneSandboxLayer
from zope.configuration import xmlconfig


class Tabs(PloneSandboxLayer):
    defaultBases = (PLONE_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        # Load ZCML
        import quintagroup.plonetabs
        xmlconfig.file('configure.zcml', quintagroup.plonetabs, context=configurationContext)

    def setUpPloneSite(self, portal):
        portal['portal_workflow'].setDefaultChain('simple_publication_workflow')
        applyProfile(portal, 'Products.CMFPlone:plone-content')
        portal['portal_workflow'].setDefaultChain('')
        applyProfile(portal, 'quintagroup.plonetabs:default')


TABS_FIXTURE = Tabs()
TABS_INTEGRATION_TESTING = IntegrationTesting(
    bases=(TABS_FIXTURE,),
    name="Tabs:Integration")

TABS_ACCEPTANCE_TESTING = FunctionalTesting(
    bases=(TABS_FIXTURE, z2.ZSERVER_FIXTURE),
    name="Tabs:Acceptance")
