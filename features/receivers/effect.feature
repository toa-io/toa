Feature: Receiver to an effect

  Scenario: Updating state with an event
    Given I compose `state.known` component
    When an event `somewhere.something.happened` is emitted with the payload:
    """
    100
    """
    And I call `state.known.get`
    Then the reply is received:
      """yaml
      output: 100
      """
    And I disconnect

