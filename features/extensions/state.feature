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

  Scenario: Using well-known context shortcut
    Given I compose `state.known` component
    When I call `state.known.set` with:
      """yaml
      input: 2
      """
    And I call `state.known.get`
    Then the reply is received:
      """yaml
      output: 2
      """
    And I disconnect

  Scenario: Using well-known context shortcut with a set
    Given I compose `state.set` component
    When I call `state.set.set` with:
      """yaml
      input: [1,2,3]
      """
    And I call `state.set.get`
    Then the reply is received:
      """yaml
      output: [1, 2, 3]
      """
    And I disconnect
