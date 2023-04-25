Feature: Node algorithm implementation syntaxes

  Algorithms output configuration value.

  Scenario Outline: Run transition with <syntax> syntax
    Given I boot `node.syntaxes` component
    When I invoke `transition_<syntax>`
    And I disconnect
    Then the reply is received:
      """
      output:
        foo: bar
      """
    Examples:
      | syntax   |
      | function |
      | class    |
      | factory  |

  Scenario Outline: Run <type> with <syntax> syntax
    Given I boot `node.syntaxes` component
    When I invoke `<type>_<syntax>` with:
      """yaml
      query: {}
      """
    And I disconnect
    Then the reply is received:
      """
      output:
        foo: bar
      """
    Examples:
      | syntax   | type        |
      | function | observation |
      | class    | observation |
      | factory  | observation |
      | function | assignment  |
      | class    | assignment  |
      | factory  | assignment  |
