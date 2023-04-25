Feature: Node algorithm implementation syntaxes

  Algorithms output configuration value.

  Scenario Outline: Run <type> with <syntax> syntax
    Given I boot `node.syntaxes` component
    When I invoke `<type>_<syntax>` with:
      """yaml
      query: {}
      """
    And I disconnect
    Then the reply is received:
      """
      output: bar
      """
    Examples:
      | syntax   | type        |
      | function | transition  |
      | class    | transition  |
      | factory  | transition  |
      | function | observation |
      | class    | observation |
      | factory  | observation |
      | function | assignment  |
      | class    | assignment  |
      | factory  | assignment  |

  Scenario Outline: Run <type> with <syntax> syntax
    Given I boot `node.syntaxes` component
    When I invoke `<type>_<syntax>`
    And I disconnect
    Then the reply is received:
      """
      output: bar
      """
    Examples:
      | syntax   | type        |
      | function | computation |
      | class    | computation |
      | factory  | computation |
      | function | effect      |
      | class    | effect      |
      | factory  | effect      |

