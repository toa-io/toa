Feature: Transactional inbox

  An operation that declares `once` changes state at most once per call, however many times that
  call arrives. What it answered is recorded with what it changed, in one transaction, so a
  second arrival is refused on the record and answered with the first one's reply.

  Background:
    Given the `mongo.once` database contains:
      | _id                              | foo | bar   | VERSION |
      | 6b93e57cc0e14fce95c4496c21086781 | 0   | hello | 1       |
    And I compose `mongo.once` component

  Scenario: The same call twice changes state once
    When I call `mongo.once.transit` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 1
        bar: world
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      foo: 1
      bar: world
      VERSION: 2
      """
    When I call `mongo.once.transit` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 9
        bar: again
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    # the second call is answered with what the first one answered, and changed nothing
    Then the reply is received:
      """yaml
      foo: 1
      bar: world
      VERSION: 2
      """
    And the `mongo.once` inbox holds 1 record

  Scenario: Two calls are two calls
    When I call `mongo.once.transit` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 1
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    And I call `mongo.once.transit` with:
      """yaml
      id: bb22e57cc0e14fce95c4496c21086781
      input:
        foo: 2
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      foo: 2
      VERSION: 3
      """
    And the `mongo.once` inbox holds 2 records

  Scenario: An operation that does not declare it is called twice
    When I call `mongo.once.plain` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 1
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    And I call `mongo.once.plain` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 2
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      foo: 2
      VERSION: 3
      """

  Scenario: A call already answered is answered again without running
    # seeding a record *is* the state of a call that was made and answered
    Given the `mongo.once` inbox contains:
      | _id                              | reply                    |
      | aa11e57cc0e14fce95c4496c21086781 | {"output":{"foo":7}}     |
    When I call `mongo.once.transit` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 1
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      foo: 7
      """
    # nothing ran, so the entity is as the background left it
    And the `mongo.once` database contains:
      | _id                              | foo | bar   | VERSION |
      | 6b93e57cc0e14fce95c4496c21086781 | 0   | hello | 1       |

  Scenario: A call that refuses is not remembered
    When I call `mongo.once.refuse` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the error is received:
      """yaml
      code: REFUSED
      """
    And the `mongo.once` inbox holds 0 records

  Scenario: A call that raises is not remembered
    When I call `mongo.once.raise` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the following exception is thrown:
      """yaml
      code: 0
      """
    And the `mongo.once` inbox holds 0 records

  Scenario: A duplicate arriving while the first is still running
    When I call `mongo.once.slow` without waiting with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 5
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    And I call `mongo.once.slow` with:
      """yaml
      id: aa11e57cc0e14fce95c4496c21086781
      input:
        foo: 5
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    # one of them committed and the other was refused at the write; the entity moved once
    Then the reply is received:
      """yaml
      foo: 5
      VERSION: 2
      """
    And the `mongo.once` inbox holds 1 record

  Scenario: A component that declares none has no collection
    Given I compose `mongo.one` component
    Then the `mongo.one` inbox collection does not exist
