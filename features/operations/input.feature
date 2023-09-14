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

  Scenario: Input validation removes additional properties
    Given I compose `dummies.one` component
    When I call `dummies.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: 'hello'
        baz: 'additional property'
      """
    Then the reply is received
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
      keyword: type
      property: input/foo
      """
    And I disconnect

  Scenario: Input schema with default value
    Given I compose `echo.beacon` component
    When I call `echo.beacon.def`
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect

  Scenario: Invocation with default value
    Given I boot `echo.beacon` component
    When I invoke `def`
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect
