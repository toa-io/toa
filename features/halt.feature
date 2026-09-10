@halt @timing
Feature: Halt

  A halted process closes everything it holds and stays up. What has to come back is not
  only what answers a call: a pulse, an outbox and a registration all keep their own time,
  and a process that came back without them would look well and do nothing.

  Every scenario here halts for the shortest halt there is, so each waits one out.

  Background:
    Given I run components:
      | mongo.one |
      | mongo.receiver |
      | pulse |
      | stash |
      | atom |

  Scenario: A call is served again
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `mongo.one.assign` with:
      """yaml
      input:
        bar: after
      """
    Then the reply is received

  Scenario: The database is written again
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
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `atom.plus` with:
      """yaml
      input:
        key: halt
      """
    Then the reply is received

  Scenario: An event still reaches its receiver
    When the process is halted for 30 seconds
    Then the process is running again
    When I call `mongo.one.assign` with:
      """yaml
      input:
        bar: emitted
      """
    Then the `mongo.receiver` eventually counts the change

  Scenario: A pulse keeps its own time again
    When the process is halted for 30 seconds
    Then the process is running again
    Then the `pulse` is called on its cadence again
