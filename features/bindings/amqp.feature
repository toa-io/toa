Feature: AMQP binding

  Scenario: Send a request and receive a reply via AMQP
    Given I compose `echo.responder` component with `@toa.io/bindings.amqp` binding
    When I call `echo.responder.echo` with:
      """yaml
      input: ok
      """
    Then the reply is received:
      """yaml
      output: ok
      """
    And I disconnect

