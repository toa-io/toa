Feature: Stash extension


  Scenario: Using aspect
    Given I boot `stash` component
    When I invoke `set` with:
      """yaml
      input: hello
      """
    When I invoke `get`
    Then the reply is received:
      """yaml
      output: hello
      """
