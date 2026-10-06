Feature: A set is bounded, and a page of it is ordered

  An operation over `entries` is called with the `ids` of its set or with a `limit` on what its
  criteria select, and a query that skips entries says in what order.

  Background:
    Given the `mongo.entries` database contains:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 1     | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 2     | 1       |
      | c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30 | 3     | 1       |
    And I compose `mongo.entries` component

  Scenario: A transition changes as many entries as its limit
    When I call `mongo.entries.bump` with:
      """yaml
      input: {}
      query:
        criteria: count>0
        sort: [count:desc]
        limit: 1
      """
    Then the reply is received:
      """yaml
      bumped: 1
      """
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 1     | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 2     | 1       |
      | c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30 | 4     | 2       |

  Scenario: A transition skips what its query omits
    When I call `mongo.entries.bump` with:
      """yaml
      input: {}
      query:
        criteria: count>0
        sort: [count:asc]
        omit: 2
        limit: 2
      """
    Then the reply is received:
      """yaml
      bumped: 1
      """

  Scenario: A transition over criteria without a limit is refused
    When I call `mongo.entries.bump` with:
      """yaml
      input: {}
      query:
        criteria: count>0
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 1     | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 2     | 1       |
      | c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30 | 3     | 1       |

  Scenario: A transition over ids needs no limit
    When I call `mongo.entries.bump` with:
      """yaml
      input: {}
      query:
        ids:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      """
    Then the reply is received:
      """yaml
      bumped: 2
      """

  Scenario: An effect reads as many entries as its limit
    When I call `mongo.entries.tally` with:
      """yaml
      query:
        criteria: count>0
        limit: 2
      """
    Then the reply is received:
      """yaml
      tallied: 2
      """

  Scenario: An effect over criteria without a limit is refused
    When I call `mongo.entries.tally` with:
      """yaml
      query:
        criteria: count>0
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: An observation over ids needs no limit
    When I call `mongo.entries.enumerate` with:
      """yaml
      query:
        ids:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      """
    Then the reply is received:
      """yaml
      - count: 1
      - count: 2
      """

  Scenario: An observation without ids or a limit is refused
    When I call `mongo.entries.enumerate` with:
      """yaml
      query:
        criteria: count>0
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: A query that omits without an order is refused
    When I call `mongo.entries.enumerate` with:
      """yaml
      query:
        omit: 1
        limit: 2
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: A query that omits in an order skips
    When I call `mongo.entries.enumerate` with:
      """yaml
      query:
        sort: [count:desc]
        omit: 1
        limit: 1
      """
    Then the reply is received:
      """yaml
      - count: 2
      """
