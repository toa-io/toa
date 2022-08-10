Feature: Operations Invocation

  Scenario Outline: Output configuration value with <endpoint>

    Given I boot node.syntaxes component
    When I invoke <endpoint>
    Then the reply should match:
      """
      output:
        foo: bar
      """
    And I disconnect
    Examples:
      | endpoint |
      | function |
      | class    |
      | factory  |
