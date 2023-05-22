Feature: Additional properties

  Scenario: Input schema with additional properties
    Given I boot `echo.beacon` component
    When I invoke `reflect` with:
      """yaml
      input:
        id: test
        foo: bar
      """
    Then the reply is received:
      """yaml
      output:
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
    Then the reply is received:
      """yaml
      output: {}
      """
    And I disconnect
