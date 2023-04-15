Feature: State extension

  Scenario: Using state in component's operations
    Given I compose `state.standard` component
    When I call `state.standard.set` with:
      """yaml
      input: 1
      """
    And I call `state.standard.get`
    Then the reply is received:
      """yaml
      output: 1
      """
    And I disconnect
