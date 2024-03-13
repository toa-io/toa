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

  Scenario: Querying with `=in=` operator
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1        |
      | 8754448197e64403878fb16d06020f0c | 0   | world | 1        |
      | 3cfc3860cccf4ab8a806a05548a49c95 | 0   | bye   | 1        |
    And I boot `mongo.one` component
    When I invoke `enumerate` with:
      """yaml
      query:
        criteria: bar=in=(hello,world)
      """
    Then the reply is received:
      """
      - id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      - id: 8754448197e64403878fb16d06020f0c
      """
