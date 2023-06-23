Feature: Stash extension

  Scenario: Using cache
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

  Scenario: Using increment
    Given I boot `stash` component
    When I invoke `del` with:
      """yaml
      input: num
      """
    And I invoke `inc` with:
      """yaml
      input: num
      """
    Then the reply is received:
      """yaml
      output: 1
      """

  Scenario: Using DLM
    Given I compose `stash` component
    When I call `default.stash.set` with:
      """yaml
      input: 0
      """
    And I call `default.stash.locks`
    And I call `default.stash.get`
    Then the reply is received:
      """yaml
      output: '3'
      """
