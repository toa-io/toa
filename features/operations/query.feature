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

  Scenario: Querying with text search
    Given the `mongo.search` database contains:
      | _id                              | foo   | bar   | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | hello | world | 1        |
      | 8754448197e64403878fb16d06020f0c | john  | doe   | 1        |
      | 3cfc3860cccf4ab8a806a05548a49c95 | tik   | tok   | 1        |
    And I boot `mongo.search` component
    When I invoke `enumerate` with:
      """yaml
      query:
        search: john doe
      """
    Then the reply is received:
      """
      - id: 8754448197e64403878fb16d06020f0c
      """

  Scenario: Observing skips deleted entries
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version | _created      | _deleted      |
      | bcb6780f50e243348cad40ed6b5ef575 | 1   | hello | 1        | 1722011800000 | 1722011755487 |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 2   | hello | 1        | 1722011700000 | null          |
    And I boot `mongo.one` component
    When I invoke `observe` with:
      """yaml
      query:
        criteria: bar==hello
        sort: [_created:desc]
      """
    Then the reply is received:
      """
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    When I invoke `observe` with:
      """yaml
      query:
        criteria: bar==hello
        sort: [_created:desc]
        deleted: true
      """
    Then the reply is received:
      """
      id: bcb6780f50e243348cad40ed6b5ef575
      """

  Scenario: Querying sample
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
        sample: 1
      """
    Then the reply is received
    # see logs
