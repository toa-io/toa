Feature: The database of a scope

  A process writes to the database its context names, followed by its suffix where it is given one,
  so processes of one context with different suffixes share a MongoDB without sharing data.

  Scenario: The database is the context
    Given an environment variable `TOA_CONTEXT` is set to "scope"
    And the `mongo.one` database in "scope" is empty
    And I compose `mongo.one` component
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: context
      """
    Then the reply is received
    And the `mongo.one` collection in "scope" holds:
      | foo | bar     |
      | 1   | context |

  Scenario: The database is the context followed by the suffix
    Given an environment variable `TOA_CONTEXT` is set to "scope"
    And an environment variable `TOA_SUFFIX` is set to "-copy"
    And the `mongo.one` database in "scope-copy" is empty
    And I compose `mongo.one` component
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 2
        bar: suffix
      """
    Then the reply is received
    And the `mongo.one` collection in "scope-copy" holds:
      | foo | bar    |
      | 2   | suffix |

  # MongoDB takes no database name longer than 63 bytes
  Scenario: A scope too long for a database name is refused
    Given an environment variable `TOA_CONTEXT` is set to "scope"
    And an environment variable `TOA_SUFFIX` is set to "-0123456789012345678901234567890123456789012345678901234567890"
    Then I compose `mongo.one` component and it fails with a message containing:
      """
      63
      """
