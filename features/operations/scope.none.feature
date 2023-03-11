Feature: No scope operations

  Scenario: Invoke no-scope operation
    Given I boot `echo.responder` component
    When I invoke `echo` with:
      """yaml
      input: hey
      """
    Then the reply is received:
      """yaml
      output: hey
      """
    And I disconnect
