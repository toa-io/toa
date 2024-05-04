Feature: Operation trailers

  Scenario: Adding a trailer to an event
    Given I compose `events.trailers` component
    When I call `events.trailers.transit` with:
      """yaml
      input:
        inc: 3
      """
    Then the reply is received:
      """
      foo: 3
      """
