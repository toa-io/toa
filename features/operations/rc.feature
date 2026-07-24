Feature: Run command

  Scenario: Set state on startup
    Given I compose `rc.ok` component
    When I call `rc.ok.echo`
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect
