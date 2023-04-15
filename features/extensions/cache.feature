Feature: Cache extension

  Scenario: Using cache in component's operations
    Given I boot `cache.dummy` component
    When I call `cache.dummy.set` with:
      """yaml
      input: 1
      """
    And I call `cache.dummy.get`
    Then the reply is received:
      """yaml
      output: 1
      """
