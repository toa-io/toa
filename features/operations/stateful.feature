Feature: Stateful operations

  Every process serves a stateful operation under an address of its own, and a call to it names the
  process it goes to.

  Scenario: A call reaches the process it names
    Given I compose `stateful.counter` component
    When I call `stateful.counter.increment` on this process with:
      """yaml
      input: reaches
      """
    And I call `stateful.counter.increment` on this process with:
      """yaml
      input: reaches
      """
    Then the reply is received:
      """yaml
      count: 2
      """

  Scenario: A call to a stateful operation that names no process is refused
    Given I compose `stateful.counter` component
    When I call `stateful.counter.increment` with:
      """yaml
      input: nameless
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: A call to a name nobody holds is refused
    Given I compose `stateful.counter` component
    When I call `stateful.counter.increment` with:
      """yaml
      input: unheld
      instance: nobody
      """
    Then the following exception is thrown:
      """yaml
      code: 403
      """

  Scenario: A call its signal aborted before it was made runs nowhere
    Given I compose components:
      | stateful.counter |
      | stateful.caller  |
    When I call `stateful.caller.relay` with:
      """yaml
      input:
        endpoint: increment
        input: withheld
        aborted: true
      """
    Then the following exception is thrown:
      """yaml
      code: 404
      """
    When I call `stateful.counter.increment` on this process with:
      """yaml
      input: withheld
      """
    Then the reply is received:
      """yaml
      count: 1
      """

  @cli
  Scenario: A call reaches another process by its name, and leaves this one untouched
    Given I have a component `stateful.counter`
    When I run `TOA_INSTANCE=far toa compose ./components/stateful.counter`
    And I compose `stateful.counter` component
    And I call `stateful.counter.increment` with:
      """yaml
      input: apart
      instance: far
      """
    And I call `stateful.counter.increment` with:
      """yaml
      input: apart
      instance: far
      """
    Then the reply is received:
      """yaml
      instance: far
      count: 2
      """
    When I call `stateful.counter.increment` on this process with:
      """yaml
      input: apart
      """
    Then the reply is received:
      """yaml
      count: 1
      """
    And I abort execution

  @cli
  Scenario: A call to a process that has stopped is refused
    Given I have a component `stateful.counter`
    When I run `TOA_INSTANCE=gone toa compose ./components/stateful.counter`
    And I compose `stateful.counter` component
    And I abort execution
    And I call `stateful.counter.increment` with:
      """yaml
      input: stopped
      instance: gone
      """
    Then the following exception is thrown:
      """yaml
      code: 403
      """

  @cli
  Scenario: A caller stops waiting for a process that crashed while holding its call
    Given I have a component `stateful.counter`
    When I run `TOA_INSTANCE=crashed toa compose ./components/stateful.counter`
    And I compose components:
      | stateful.counter |
      | stateful.caller  |
    And I call `stateful.caller.relay` without waiting with:
      """yaml
      input:
        instance: crashed
        endpoint: linger
        input: 60000
        timeout: 2000
      """
    And I wait 0.5 seconds
    And I kill execution
    And I wait 3 seconds
    Then the following exception is thrown:
      """yaml
      code: 404
      """

  @containers
  Scenario: A process holds its name again after the broker restarts
    Given I start docker container `rabbitmq`
    And an environment variable `TOA_DEV_AMQP` is set to "amqp://developer:secret@localhost:31012"
    And I compose `stateful.counter` component
    When I call `stateful.counter.increment` on this process with:
      """yaml
      input: restarted
      """
    And I stop docker container `rabbitmq`
    And I start docker container `rabbitmq`
    And I call `stateful.counter.increment` on this process until it is answered, within 90 seconds, with:
      """yaml
      input: restarted
      """
    Then the reply is received:
      """yaml
      count: 2
      """
