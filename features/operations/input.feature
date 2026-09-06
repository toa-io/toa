Feature: Additional properties

  Scenario: Input schema with additional properties
    Given I compose `echo.beacon` component
    When I call `echo.beacon.reflect` with:
      """yaml
      input:
        id: test
        foo: bar
      """
    Then the reply is received:
      """yaml
      id: test
      foo: bar
      """
    And I disconnect

  Scenario: Input type mismatch
    Given I compose `dummies.one` component
    When I call `dummies.one.transit` with:
      """yaml
      input:
        foo: 'not a number'
        bar: 'ok'
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """
    And I disconnect

  Scenario: Forwarded operation
    Given I compose `echo.beacon` component
    When I call `echo.beacon.def` with:
      """yaml
      input: ok
      """
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect

  Scenario: Invoking a forwarded operation
    Given I boot `echo.beacon` component
    When I invoke `def` with:
      """yaml
      input: ok
      """
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect
