Feature: MongoDB migrations

  Scenario: Creating a unique index
    Given the `mongo.indexed` database contains:
      | _id                              | name | email            | birthday      | weight | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | John | john@example.com | 1709446907166 | 50     | 1       |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcaf | Mary | mary@example.com | 1709446907166 | 60     | 1       |
    And I compose `mongo.indexed` component
    When I call `mongo.indexed.transit` with:
      """yaml
      input:
        name: Mary
        email: john@example.com
      """
    Then the following exception is thrown:
      """yaml
      code: 306
      message: DuplicateException
      """

  Scenario: Update with index violation
    Given the `mongo.indexed` database contains:
      | _id                              | name | email            | birthday      | weight | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | John | john@example.com | 1709446907166 | 50     | 1       |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcaf | Mary | mary@example.com | 1709446907166 | 60     | 1       |
    And I compose `mongo.indexed` component
    When I call `mongo.indexed.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcaf
      input:
        email: john@example.com
      """
    Then the following exception is thrown:
      """yaml
      code: 306
      message: DuplicateException
      """

  Scenario: A unique index holds over live records only

  Nothing is ever hard-deleted, so a tombstone under a plain unique index would hold its key
  for good and the value could never be used again.

    Given the `mongo.indexed` database contains:
      | _id                              | name | email            | DELETED       | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | John | john@example.com | 1709446907166 | 2       |
    And I compose `mongo.indexed` component
    When I call `mongo.indexed.transit` with:
      """yaml
      input:
        name: Bill
        email: john@example.com
      """
    Then the reply is received:
      """
      email: john@example.com
      """

  Scenario: A migration declares the indexes a component has
    Given the `mongo.indexed` database contains:
      | _id                              | name | email            | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | John | john@example.com | 1        |
    When I compose `mongo.indexed` component
    Then the `mongo.indexed` collection has indexes:
      | name             | keys                       | unique | sparse |
      | unique_email     | {"email":1}                | true   | false  |
      | unique_optional  | {"tag":1}                  | true   | false  |
      | index_some       | {"birthday":-1,"weight":1} | false  | true   |
      | index_some_other | {"name":"hashed"}          | false  | false  |

  Scenario: A migration reshapes an index without renaming it

  The index `0002-indexes` makes is declared again by `0003-reshape` under the same name and a
  different shape. Before migrations this was the change that silently did nothing.

    Given the `mongo.migrated` database contains:
      | _id                              | a | b | runs | VERSION |
      | 82cf9b0ab0ac4ab2b8036e4e940ddcae | x | y | 0    | 1        |
    When I compose `mongo.migrated` component
    Then the `mongo.migrated` collection has indexes:
      | name        | keys              |
      | index_shape | {"a":1,"b":-1}    |
    And the `mongo.migrated` migrations are recorded:
      | migration              | state |
      | 0001-system-properties | done  |
      | 0002-indexes           | done  |
      | 0003-reshape           | done  |

  Scenario: A migration changes records

    Given the `mongo.migrated` database contains:
      | _id                              | a | b | runs | VERSION |
      | 82cf9b0ab0ac4ab2b8036e4e940ddcae | x | y | 0    | 1        |
    When I compose `mongo.migrated` component
    Then the `mongo.migrated` collection holds:
      | _id                              | runs |
      | 82cf9b0ab0ac4ab2b8036e4e940ddcae | 1    |

  Scenario: A recorded migration is not applied again

  What makes a migration run once is its row, not the start it was applied on: a component
  that boots over a database already carrying the row leaves the records alone.

    Given the `mongo.migrated` database contains:
      | _id                              | a | b | runs | VERSION |
      | 82cf9b0ab0ac4ab2b8036e4e940ddcae | x | y | 0    | 1        |
    And the `mongo.migrated` migration 0003-reshape is recorded
    When I compose `mongo.migrated` component
    Then the `mongo.migrated` collection holds:
      | _id                              | runs |
      | 82cf9b0ab0ac4ab2b8036e4e940ddcae | 0    |
    And the `mongo.migrated` collection has indexes:
      | name        | keys      |
      | index_shape | {"a":1}   |

  Scenario: A migration renames the system properties of a record

  What every stored component declares as `0001-system-properties`, to rename what a release
  before 1.0.0-alpha.286 wrote.

    Given the `mongo.migrated` database contains:
      | _id                              | a | b | runs | _version | _created | _deleted |
      | 82cf9b0ab0ac4ab2b8036e4e940ddcae | x | y | 0    | 1        | 1709446907166 | null |
    When I compose `mongo.migrated` component
    Then the `mongo.migrated` collection holds:
      | _id                              | VERSION | CREATED       | DELETED |
      | 82cf9b0ab0ac4ab2b8036e4e940ddcae | 1       | 1709446907166 | null    |
    And the `mongo.migrated` migrations are recorded:
      | migration              | state |
      | 0001-system-properties | done  |

  Scenario: A storage that does not apply what a component declares refuses to start
    Then I compose `plain.migrated` component and it fails with:
      """
      Component 'plain.migrated' declares migrations, which storage '@toa.io/storages.null' does not apply
      """

