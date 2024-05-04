Feature: Receiver arguments

  Scenario: Using receiver arguments
    Given I compose components:
      | mongo.one           |
      | receivers.arguments |
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 0
      """
    Then the reply is received:
      """
      foo: 0
      """
