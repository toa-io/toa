Feature: A transition over entries commits all or nothing

  A transition over `entries` reads a set, and commits it as one compare-and-swap: where any
  entry has been changed since it was read, or one it creates has been created meanwhile, nothing
  of the set is written, and the transition raises as its `concurrency` says.

  Background:
    Given the `mongo.entries` database contains:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 0     | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 0     | 1       |

  Scenario: A set whose entries nobody touched is written whole
    Given I compose `mongo.entries` component
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
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 1     | 2       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 1     | 2       |
    And the `mongo.entries` outbox holds 2 rows

  Scenario: A set one of whose entries was changed under it writes nothing
    Given I compose `mongo.entries` component
    When I call `mongo.entries.bump` with:
      """yaml
      input:
        touch: b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      query:
        ids:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      """
    Then the following exception is thrown:
      """yaml
      code: 304
      """
    # the entry nobody touched is as it was, and the touched one is as the other call left it
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 0     | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | 10    | 2       |
    # the event of the other call, and none of the set's
    And the `mongo.entries` outbox holds 1 row

  Scenario: A set one of whose new entries was created under it writes nothing
    Given I compose `mongo.entries` component
    When I call `mongo.entries.bump` with:
      """yaml
      input:
        touch: c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30
      query:
        ids:
          - a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
          - c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30
      """
    Then the following exception is thrown:
      """yaml
      code: 304
      """
    And the `mongo.entries` collection holds:
      | _id                              | count | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | 0     | 1       |
      | c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30 | 10    | 1       |
    And the `mongo.entries` outbox holds 1 row
