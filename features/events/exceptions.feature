Feature: Event exceptions

  Exceptions returned from operations must cause process to crash, in which case the event message
  will be requeued and retried later.

  @skip
  Scenario: Throwing exception while processing an event
    Given I compose components:
      | mongo.one            |
      | receivers.exceptions |
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 0
        bar: throw
      """

    # required
    Then the reply is received
