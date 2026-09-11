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

  Scenario: Observing what a projection names
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1       |
    And I compose `mongo.one` component
    When I call `mongo.one.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        projection: [bar]
      """
    Then the reply is received:
      """
      bar: hello
      """

  # a transition writes back the record it read, so it reads the whole of it
  Scenario: A transition refuses a projection
    Given I compose `mongo.one` component
    When I call `mongo.one.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        projection: [bar]
      input:
        bar: hello
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: Querying with `=in=` operator
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1       |
      | 8754448197e64403878fb16d06020f0c | 0   | world | 1       |
      | 3cfc3860cccf4ab8a806a05548a49c95 | 0   | bye   | 1       |
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
      | _id                              | foo   | bar   | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | hello | world | 1       |
      | 8754448197e64403878fb16d06020f0c | john  | doe   | 1       |
      | 3cfc3860cccf4ab8a806a05548a49c95 | tik   | tok   | 1       |
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
      | _id                              | foo | bar   | VERSION | CREATED       | DELETED       |
      | bcb6780f50e243348cad40ed6b5ef575 | 1   | hello | 1       | 1722011800000 | 1722011755487 |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 2   | hello | 1       | 1722011700000 | null          |
    And I boot `mongo.one` component
    When I invoke `observe` with:
      """yaml
      query:
        criteria: bar==hello
        sort: [CREATED:desc]
      """
    Then the reply is received:
      """
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    When I invoke `observe` with:
      """yaml
      query:
        criteria: bar==hello
        sort: [CREATED:desc]
        deleted: true
      """
    Then the reply is received:
      """
      id: bcb6780f50e243348cad40ed6b5ef575
      """

  Scenario: Querying sample
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1       |
      | 8754448197e64403878fb16d06020f0c | 0   | world | 1       |
      | 3cfc3860cccf4ab8a806a05548a49c95 | 0   | bye   | 1       |
    And I boot `mongo.one` component
    When I invoke `enumerate` with:
      """yaml
      query:
        criteria: bar=in=(hello,world)
        sample: 1
      """
    Then the reply is received
    # see logs
