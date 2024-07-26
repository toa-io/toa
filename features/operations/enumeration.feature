Feature: Enumeration

  Scenario: Enumerate entries
    Given the `mongo.one` database contains:
      | _id | foo | bar | _version |
    And I compose `mongo.one` component
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: baz
      """
    Then the reply is received
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 2
        bar: qux
      """
    Then the reply is received
    When I call `mongo.one.enumerate` with:
      """yaml
      query:
        limit: 10
      """
    Then the reply is received:
      """yaml
      - foo: 1
        bar: baz
      - foo: 2
        bar: qux
      """

  Scenario: Enumerate entries with deleted
    Given the `mongo.one` database contains:
      | _id                              | foo | bar | _version | _deleted      |
      | bcb6780f50e243348cad40ed6b5ef575 | 1   | baz | 1        | 1722011755487 |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 2   | qux | 1        | null          |
    And I compose `mongo.one` component
    When I call `mongo.one.enumerate` with:
      """yaml
      query:
        limit: 10
      """
    Then the reply is received:
      """yaml
      - foo: 2
        bar: qux
      """
