Feature: A call that may only read reaches nothing that writes

  A request states that it only reads, and every call made under it is held to that: a call to a
  transition, an assignment, an effect or an unmanaged operation is refused where it is made,
  however far down the chain it is.

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | VERSION |
      | 5ba4a9e1cba943a3b39a0e44ad2cbe11 | 1   | 1       |

  Scenario: An observation answers
    Given I compose `mongo.one` component
    When I call `mongo.one.observe` with:
      """yaml
      readonly: true
      query:
        id: 5ba4a9e1cba943a3b39a0e44ad2cbe11
      """
    Then the reply is received:
      """yaml
      foo: 1
      """

  Scenario: A transition is refused
    Given I compose `mongo.one` component
    When I call `mongo.one.transit` with:
      """yaml
      readonly: true
      query:
        id: 5ba4a9e1cba943a3b39a0e44ad2cbe11
      input:
        foo: 2
      """
    Then the following exception is thrown:
      """yaml
      code: 700
      """
    # nothing was sent, so nothing was written
    And the `mongo.one` collection holds:
      | _id                              | foo |
      | 5ba4a9e1cba943a3b39a0e44ad2cbe11 | 1   |

  Scenario: An assignment is refused
    Given I compose `mongo.one` component
    When I call `mongo.one.assign` with:
      """yaml
      readonly: true
      query:
        id: 5ba4a9e1cba943a3b39a0e44ad2cbe11
      input:
        foo: 2
      """
    Then the following exception is thrown:
      """yaml
      code: 700
      """
    And the `mongo.one` collection holds:
      | _id                              | foo |
      | 5ba4a9e1cba943a3b39a0e44ad2cbe11 | 1   |

  Scenario: An effect is refused
    Given I compose `mongo.one` component
    When I call `mongo.one.ensure` with:
      """yaml
      readonly: true
      entity:
        foo: 7
      """
    Then the following exception is thrown:
      """yaml
      code: 700
      """

  Scenario: An unmanaged operation is refused
    Given I compose `unmanaged` component
    When I call `unmanaged.insert` with:
      """yaml
      readonly: true
      """
    Then the following exception is thrown:
      """yaml
      code: 700
      """

  Scenario: The chain carries it
    Given I compose components:
      | safety.proxy |
      | mongo.one    |
    When I call `safety.proxy.write` with:
      """yaml
      readonly: true
      input:
        id: 5ba4a9e1cba943a3b39a0e44ad2cbe11
        foo: 2
      """
    Then the following exception is thrown:
      """yaml
      code: 700
      """
    And the `mongo.one` collection holds:
      | _id                              | foo |
      | 5ba4a9e1cba943a3b39a0e44ad2cbe11 | 1   |

  Scenario: A caller cannot clear it
    Given I compose components:
      | safety.proxy |
      | mongo.one    |
    # the operation makes its own call with `readonly: false`, which is not a way out
    When I call `safety.proxy.insist` with:
      """yaml
      readonly: true
      input:
        id: 5ba4a9e1cba943a3b39a0e44ad2cbe11
        foo: 2
      """
    Then the following exception is thrown:
      """yaml
      code: 700
      """
    And the `mongo.one` collection holds:
      | _id                              | foo |
      | 5ba4a9e1cba943a3b39a0e44ad2cbe11 | 1   |

  Scenario: The chain reads
    Given I compose components:
      | safety.proxy |
      | mongo.one    |
    When I call `safety.proxy.read` with:
      """yaml
      readonly: true
      input:
        id: 5ba4a9e1cba943a3b39a0e44ad2cbe11
      """
    Then the reply is received:
      """yaml
      1
      """

  Scenario: The same chain writes without it
    Given I compose components:
      | safety.proxy |
      | mongo.one    |
    When I call `safety.proxy.write` with:
      """yaml
      input:
        id: 5ba4a9e1cba943a3b39a0e44ad2cbe11
        foo: 2
      """
    Then the `mongo.one` collection holds:
      | _id                              | foo |
      | 5ba4a9e1cba943a3b39a0e44ad2cbe11 | 2   |

  Scenario: Arming a delay is refused
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `delaying` component
    # what it hands over is a computation; handing it over is the write, and that is refused
    When I call `default.delaying.defer` with:
      """yaml
      readonly: true
      input:
        delay: 300
      """
    Then the following exception is thrown:
      """yaml
      code: 700
      """
