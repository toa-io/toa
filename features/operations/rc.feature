Feature: Run command

  Scenario: Set state on preflight
    Given I compose `rc.ok` component
    When I call `rc.ok.echo`
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect

  Scenario: Call local operations on settle
    Given I compose `rc.settle` component
    When I call `rc.settle.echo`
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect

  Scenario: Reject RC without phases
    Then I compose `rc.none` component and it fails with:
      """
      RC 'empty' must export preflight and/or settle
      """
