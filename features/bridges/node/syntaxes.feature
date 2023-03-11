Feature: Node algorithm implementation syntaxes

  Scenario Outline: Run operation with <endpoint> syntax

  Algorithm outputs configuration value.

    Given I boot `node.syntaxes` component
    When I invoke <endpoint>
    And I disconnect
    Then the reply is received:
      """
      output:
        foo: bar
      """
    Examples:
      | endpoint |
      | function |
      | class    |
      | factory  |
