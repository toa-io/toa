Feature: What continuity refuses

  Background:
    Given the `continued.flow` task queue is empty
    And the `continuity.journal` database is empty
    And the `continuity` service is staged

  Scenario: A call that waits for a continued operation is refused

    A run is known by the identity a task or an event carries on every attempt, and a caller that
    waits retries under an identity of its own.

    Given I compose components:
      | continued.tally |
      | continued.flow  |
    When I call `continued.flow.run` with:
      """yaml
      input:
        a: 0a000000000000000000000000000011
        b: 0b000000000000000000000000000011
        fail: 0
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: A step answering with a stream parks the run at once
    Given the parked queue is empty
    And I compose components:
      | continued.tally |
      | continued.flow  |
      | streams.numbers |
    When I call `continued.flow.streamed` with:
      """yaml
      input:
        a: 0a000000000000000000000000000012
        b: 0b000000000000000000000000000012
        fail: 0
      task: true
      """
    Then `continued.flow` keeps the task at once, saying `Unrecordable`

  Scenario: Continuing what is not an effect
    When I compose `continued.misdeclared` component and it fails with a message containing:
      """
      'transit' is not an effect
      """
