Feature: Deploying mail extension

  Scenario: Deploying mail service
    Given I have a component `spam.sender`
    Given I have a context
    When I export images
    Then the file ./images/extension-mail-agent.*/Dockerfile contains exact line 'CMD toa serve .'
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: mail-agent
      """
