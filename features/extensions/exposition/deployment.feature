Feature: Exposition deployment

  Background:
    Given I have a component `exposed.one`

  Scenario: Dockerfile has correct command
    Given I have a context with:
      """
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export images
    Then the file ./images/extensions-exposition-gateway.*/Dockerfile contains exact line 'CMD toa serve .'

  Scenario: Deploying component configuration
    Given I have a context with:
      """yaml
      configuration:
        identity.tokens:
          key0: secret.key.0
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: exposition-gateway
          variables:
          - name: TOA_CONFIGURATION_IDENTITY_TOKENS
            value: eyJrZXkwIjoic2VjcmV0LmtleS4wIn0=
      """

  Scenario: Deploying database pointer
    Given I have a context with:
      """yaml
      configuration:
        identity.tokens:
          key0: secret.key.0
      mongodb: mongodb://database.url
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: exposition-gateway
          variables:
          - name: TOA_MONGODB_IDENTITY_TOKENS
            value: mongodb://database.url
          - name: TOA_MONGODB_IDENTITY_BASIC
            value: mongodb://database.url
      """
