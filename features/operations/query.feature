Feature: Query

  Scenario: Querying with boolean criteria selector
    Given I boot `mongo.one` component
    When I invoke `transit` with:
      """yaml
      input:
        baz: true
      """
    Then the reply is received:
      """
      baz: true
      """
    When I invoke `observe` with:
      """yaml
      query:
        criteria: baz==true
      """
    Then the reply is received:
      """
      baz: true
      """
