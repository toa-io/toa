Feature: What a process is handling

  A process cannot disconnect while a message it took is still being handled, so what it is
  handling is what a shutdown has to wait for. The binding counts them.

  Background:
    Given calls within this process go through the broker

  Scenario: A request being handled is counted once, and the caller waiting for it is not
    Given I compose `holding` component
    When I call `holding.hold` without waiting with:
      """yaml
      input: 3000
      """
    Then the process is eventually handling 1 delivery
    When the pending reply is received
    Then the process is handling nothing

  Scenario: An event being handled is counted, and so is the request it causes
    Given the `receivers.holding` event queues are empty
    And I compose components:
      | mongo.one         |
      | receivers.holding |
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 0
      """
    Then the process is eventually handling 2 deliveries
    And the process is eventually handling 0 deliveries
