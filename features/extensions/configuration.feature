Feature: Configuration Extension

  Scenario: Should have configuration
    Given I boot `configuration.base` component
    When I invoke `echo`
    Then the reply is received:
      """yaml
      output:
        foo: hello
      """
    And I disconnect

  Scenario: Should extend configuration from prototype
    Given I boot `configuration.extended` component
    When I invoke `echo`
    Then the reply is received:
      """yaml
      output:
        foo: hello
        bar: 1
      """
    And I disconnect
