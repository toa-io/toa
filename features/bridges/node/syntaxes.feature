Feature: Node algorithm implementation syntaxes

  Algorithms output configuration value.

  Scenario Outline: Run <type> with <syntax> syntax
    Given I boot `node.syntaxes` component
    When I invoke `<type><syntax>` with:
      """yaml
      query: {}
      """
    And I disconnect
    Then the reply is received:
      """
      bar
      """
    Examples:
      | syntax   | type        |
      | Function | transition  |
      | Class    | transition  |
      | Factory  | transition  |
      | Function | observation |
      | Class    | observation |
      | Factory  | observation |
      | Function | assignment  |
      | Class    | assignment  |
      | Factory  | assignment  |

  Scenario Outline: Run <type> with <syntax> syntax
    Given I boot `node.syntaxes` component
    When I invoke `<type><syntax>`
    And I disconnect
    Then the reply is received:
      """
      bar
      """
    Examples:
      | syntax   | type        |
      | Function | computation |
      | Class    | computation |
      | Factory  | computation |
      | Function | effect      |
      | Class    | effect      |
      | Factory  | effect      |
