Feature: A transition that sets DISCARD commits nothing

  A transition whose algorithm sets `DISCARD` on its state writes nothing, emits nothing, and
  answers what the algorithm returned. Over `entries`, an entry flagged so is left out of the set,
  and the rest is committed.

  Background:
    Given the `mongo.entries` database contains:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 0     | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 0     | 1       |

  Scenario: A discarded transition answers and writes nothing
    Given I compose `mongo.entries` component
    When I call `mongo.entries.skip` with:
      """yaml
      query:
        id: a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
      """
    Then the reply is received:
      """yaml
      count: 1
      """
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 0     | 1       |
    And the `mongo.entries` outbox holds 0 rows

  Scenario: A discarded transition creates no associated entity
    Given I compose `mongo.entries` component
    When I call `mongo.entries.skip` with:
      """yaml
      query:
        id: c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30
      """
    Then the reply is received:
      """yaml
      count: 1
      """
    And the `mongo.entries` collection holds 2 records
    And the `mongo.entries` outbox holds 0 rows

  Scenario: A discarded call is not remembered
    Given the `mongo.once` database contains:
      | _id                              | foo | VERSION |
      | 6b93e57cc0e14fce95c4496c21086781 | 0   | 1       |
    And I compose `mongo.once` component
    When I call `mongo.once.hold` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 1
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      foo: 1
      """
    And the `mongo.once` collection holds:
      | _id                              | foo | VERSION |
      | 6b93e57cc0e14fce95c4496c21086781 | 0   | 1       |
    And the `mongo.once` inbox holds 0 records

  Scenario: A set commits the entries it did not discard
    Given I compose `mongo.entries` component
    When I call `mongo.entries.bump` with:
      """yaml
      input:
        discard:
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      query:
        ids:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      """
    Then the reply is received:
      """yaml
      bumped: 2
      """
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 1     | 2       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 0     | 1       |
    And the `mongo.entries` outbox holds 1 row

  Scenario: A set whose every entry is discarded writes nothing
    Given I compose `mongo.entries` component
    When I call `mongo.entries.bump` with:
      """yaml
      input:
        discard:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      query:
        ids:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      """
    Then the reply is received:
      """yaml
      bumped: 2
      """
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 0     | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 0     | 1       |
    And the `mongo.entries` outbox holds 0 rows

  Scenario: A discarded entry changed under the set leaves the commit of the rest intact
    Given I compose `mongo.entries` component
    When I call `mongo.entries.bump` with:
      """yaml
      input:
        touch: b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
        discard:
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      query:
        ids:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      """
    Then the reply is received:
      """yaml
      bumped: 2
      """
    # the discarded entry as the other call left it
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 1     | 2       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 10    | 2       |
    # the other call's event, and the one of the entry committed
    And the `mongo.entries` outbox holds 2 rows
