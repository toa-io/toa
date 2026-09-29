@halt @timing
Feature: Halt

  A halted process closes everything it holds and stays up. What has to come back is not
  only what answers a call: a pulse, an outbox and a registration all keep their own time,
  and a process that came back without them would look well and do nothing.

  Every scenario here halts for the shortest halt there is, so each waits one out.

  Scenario: A call is served again
    Given I run components:
      | mongo.one |
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `mongo.one.assign` with:
      """yaml
      input:
        bar: after
      """
    Then the reply is received

  Scenario: The database is written again
    Given I run components:
      | mongo.one |
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `mongo.one.assign` with:
      """yaml
      input:
        bar: written
      """
    Then the reply is received:
      """yaml
      bar: written
      """

  Scenario: The cache is reached again
    Given I run components:
      | stash |
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `stash.set` with:
      """yaml
      input: after
      """
    And I call `stash.get` with:
      """yaml
      {}
      """
    Then the reply is received:
      """yaml
      after
      """

  Scenario: What the replicas decide together is decided again
    Given I run components:
      | atom |
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `atom.plus` with:
      """yaml
      input:
        key: halt
      """
    Then the reply is received

  Scenario: An event still reaches its receiver
    Given I run components:
      | mongo.one |
      | mongo.receiver |
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `mongo.one.assign` with:
      """yaml
      input:
        bar: emitted
      """
    Then the `mongo.receiver` eventually counts the change

  Scenario: A pulse keeps its own time again
    Given I run components:
      | pulse |
    When the process is halted for 30 seconds
    Then the process is running again
    Then the `pulse` is called on its cadence again

  Scenario: A call put off before a halt is still made after it
    Given the `cadence.metronome` database is empty
    And I run `cadence` service with components:
      | delaying |
    When I call `default.delaying.later` with:
      """yaml
      input:
        note: waited
        delay: 45000
      """
    And the process is halted for 30 seconds
    Then the process is running again
    Then the `delaying` eventually marks `waited`

  Scenario: A call put off after a halt is made
    Given the `cadence.metronome` database is empty
    And I run `cadence` service with components:
      | delaying |
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `default.delaying.later` with:
      """yaml
      input:
        note: armed
        delay: 300
      """
    Then the `delaying` eventually marks `armed`

  # What was in flight is finished before anything closes, and what it calls in this same process
  # is served until it is: a component that stopped taking calls first would leave its caller
  # waiting on it for good, and the process would never come back.
  Scenario: A task in flight that calls a component of the same process is finished first
    Given the `continued.tally` database is empty
    And I run components:
      | continued.tally |
      | halting.relay   |
    When I call `halting.relay.pass` with:
      """yaml
      input:
        id: 0d000000000000000000000000000001
      task: true
      """
    And the process is halted for 30 seconds
    Then the process is running again
    And the `continued.tally` database holds:
      | _id                              | n |
      | 0d000000000000000000000000000001 | 1 |
