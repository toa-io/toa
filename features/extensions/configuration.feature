Feature: Configuration Extension

  Scenario: Should has configuration
    Given I boot `configuration.simple` component
    When I invoke `transit`
    Then the reply is received:
      """yaml
      output:
        foo: Hello
      """
    And I disconnect

  Scenario: Should extend configuration from prototype
    Given I boot `configuration.prototype` component
    When I invoke `transit`
    Then the reply is received:
      """yaml
      output:
        foo: Hello
      """
    And I disconnect
