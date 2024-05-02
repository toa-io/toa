Feature: Operation trailers

  Scenario: Adding a trailer to an event
    Given I compose `mongo.trailers` component
    When I call `mongo.trailers.transit` with:
      """yaml
      input:
        inc: 3
      """
    Then the reply is received:
      """
      foo: 3
      """
