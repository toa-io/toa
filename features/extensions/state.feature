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

  Scenario: Using well-known context shortcut with set
    Given I compose `state.uniq` component
    When I call `state.uniq.set` with:
      """yaml
      input:
        value1: 1
        value2: 2
        value3: 1
      """
    And I call `state.uniq.get`
    Then the reply is received:
      """yaml
      output: [1, 2]
      """
    And I disconnect
