Feature: Remote calls

  Scenario: Calling a remote
    Given I compose components:
      | math.calculations |
      | math.proxy        |
    When I call `math.proxy.sum` with:
      """yaml
      input:
        a: 1
        b: 2
      """
    Then the reply is received:
      """yaml
      output: 3
      """
    And I disconnect

  Scenario: Calling a remote within a `default` namespace
    Given I compose components:
      | calculations   |
      | recalculations |
    When I call `default.recalculations.sum` with:
      """yaml
      input:
        a: 1
        b: 2
      """
    Then the reply is received:
      """yaml
      output: 3
      """
    And I disconnect
