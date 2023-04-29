Feature: Additional properties

  Scenario: Input schema with additional properties
    Given I boot `echo.responder` component
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

