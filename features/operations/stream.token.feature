Feature: A stream ends with a token

  A reader keeping a copy of a collection reads it once, and from then on only what changed in it.

  Background:
    Given the `streams.tokens` database contains:
      | _id                              | owner | title | VERSION | DELETED |
      | a0000000000000000000000000000001 | alice | milk  | 1       | null    |
      | a0000000000000000000000000000002 | alice | bread | 1       | null    |
      | a0000000000000000000000000000003 | alice | eggs  | 1       | null    |
      | b0000000000000000000000000000001 | bob   | tea   | 1       | null    |
    And I compose `streams.tokens` component

  Scenario: Reading a collection
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the stream ended with a token
    And the copy holds:
      | id                               | owner | title | VERSION |
      | a0000000000000000000000000000001 | alice | milk  | 1       |
      | a0000000000000000000000000000002 | alice | bread | 1       |
      | a0000000000000000000000000000003 | alice | eggs  | 1       |

  Scenario: Reading what changed since the token
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    And I call `streams.tokens.transit` with:
      """yaml
      input:
        title: butter
      query:
        id: a0000000000000000000000000000002
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the stream ended with a token
    And the parts read are:
      """yaml
      - entry:
          id: a0000000000000000000000000000002
          title: butter
          VERSION: 2
      """
    And the copy holds:
      | id                               | title  | VERSION |
      | a0000000000000000000000000000001 | milk   | 1       |
      | a0000000000000000000000000000002 | butter | 2       |
      | a0000000000000000000000000000003 | eggs   | 1       |

  Scenario: Nothing changed since the token
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the stream ended with a token
    And the parts read are:
      """yaml
      []
      """

  Scenario: A write that commits after a later one is read once it commits
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    And a transaction writes to the `streams.tokens` collection, and is held open:
      | id                               | owner | title  |
      | a0000000000000000000000000000004 | alice | cheese |
    And I call `streams.tokens.transit` with:
      """yaml
      input:
        title: butter
      query:
        id: a0000000000000000000000000000002
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the parts read are:
      """yaml
      - entry:
          id: a0000000000000000000000000000002
          title: butter
      """
    When the transaction commits
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the parts read are:
      """yaml
      - entry:
          id: a0000000000000000000000000000004
          title: cheese
      """
    And the copy holds 4 entries

  Scenario: A converged write is read with the changes
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    And the `streams.tokens` record `a0000000000000000000000000000003` arrives as another region wrote it:
      """yaml
      owner: alice
      title: yoghurt
      VERSION: 5
      CREATED: 1000
      UPDATED: 2000
      DELETED: null
      REGION: us
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the parts read are:
      """yaml
      - entry:
          id: a0000000000000000000000000000003
          title: yoghurt
          VERSION: 5
      """

  Scenario: Entries that leave the collection are removed
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    And I call `streams.tokens.transit` with:
      """yaml
      input:
        owner: bob
      query:
        id: a0000000000000000000000000000001
      """
    And I call `streams.tokens.terminate` with:
      """yaml
      query:
        id: a0000000000000000000000000000002
      """
    And the `streams.tokens` record `a0000000000000000000000000000003` is taken out of the collection
    And I call `streams.tokens.transit` with:
      """yaml
      input:
        title: coffee
      query:
        id: b0000000000000000000000000000001
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the parts read are:
      """yaml
      - removed: a0000000000000000000000000000001
      - removed: a0000000000000000000000000000002
      - removed: a0000000000000000000000000000003
      """
    And the copy holds 0 entries

  Scenario: An entry that enters the collection is read
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    And I call `streams.tokens.transit` with:
      """yaml
      input:
        owner: alice
      query:
        id: b0000000000000000000000000000001
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the parts read are:
      """yaml
      - entry:
          id: b0000000000000000000000000000001
          owner: alice
      """

  Scenario: Reading a collection in pages
    Given the `streams.tokens` database contains:
      | _id                              | owner | title | VERSION | DELETED |
      | a0000000000000000000000000000001 | alice | a     | 1       | null    |
      | a0000000000000000000000000000002 | alice | b     | 1       | null    |
      | a0000000000000000000000000000003 | alice | c     | 1       | null    |
      | a0000000000000000000000000000004 | alice | d     | 1       | null    |
      | a0000000000000000000000000000005 | alice | e     | 1       | null    |
      | b0000000000000000000000000000001 | bob   | f     | 1       | null    |
    When I read the whole of `streams.tokens.stream` in pages of 2 with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the copy holds 5 entries

  Scenario: A page ends with a token that continues the collection
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
        limit: 2
      """
    Then the stream ended with a token
    And the parts read are:
      """yaml
      - entry:
          id: a0000000000000000000000000000001
      - entry:
          id: a0000000000000000000000000000002
      """
    When I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
        limit: 2
      """
    Then the parts read are:
      """yaml
      - entry:
          id: a0000000000000000000000000000003
      """

  Scenario: An entry created behind the page boundary arrives with the changes
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
        limit: 2
      """
    And a transaction writes to the `streams.tokens` collection, and is held open:
      | id                               | owner | title |
      | a0000000000000000000000000000000 | alice | salt  |
    And the transaction commits
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
        limit: 2
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
        limit: 2
      """
    Then the copy holds 4 entries

  Scenario: A token read under other criteria
    When I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==bob
      """
    Then the following exception is thrown:
      """yaml
      code: 221
      """

  Scenario: A token that names no position
    When I call `streams.tokens.stream` with:
      """yaml
      query:
        token: eyJ2IjoxfQ
      """
    Then the following exception is thrown:
      """yaml
      code: 308
      """

  Scenario: Sorting a read that pages
    When I call `streams.tokens.stream` with:
      """yaml
      query:
        limit: 2
        sort: title:desc
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: A collection that keeps no images
    Given the `operations.streams` database contains:
      | _id | foo | bar   | VERSION |
      | x1  | 1   | hello | 1       |
    And I compose `operations.streams` component
    When I read `operations.streams.stream` with:
      """yaml
      query: {}
      """
    Then the stream ended with no position to continue from
    And the copy holds 1 entries
