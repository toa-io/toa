Feature: Exposition deployment

  Background:
    Given I have a component `exposed.one`
    And I have a context

  Scenario: Dockerfile has correct command
    When I export images
    Then the file ./images/extensions-exposition-gateway.*/Dockerfile contains exact line 'CMD toa serve .'

  Scenario: Deploying Identity
    When I export deployment
    And I export images
    Then exported values should contain:
      """yaml
      compositions:
        - group: extensions
          name: exposition-identity
          components:
            - identity.basic
      """
    And the file ./images/extensions-exposition-identity.*/Dockerfile contains exact line 'CMD toa compose *'
