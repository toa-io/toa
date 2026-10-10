Feature: Requests of a component on one queue

  Every ordinary call to a component arrives on one queue, whichever of its operations it names.

  Background:
    Given calls within this process go through the broker

  Scenario: Calls to two operations each reach the one they name

    One queue carries them all, so what says which operation to run is the message rather
    than the queue it arrived on.

    Given I compose `echo.beacon` component
    When I call `echo.beacon.echo` with:
      """yaml
      input: hello
      """
    Then the reply is received:
      """yaml
      hello
      """
    When I call `echo.beacon.reflect` with:
      """yaml
      input:
        id: one
      """
    Then the reply is received:
      """yaml
      id: one
      """

  Scenario: A component consumes one request queue

    What the broker holds for a component's calls does not grow with the operations it
    declares.

    When I compose `echo.beacon` component
    Then the queue "echo.beacon..requests" is consumed
    And the queue "echo.beacon.echo" is not consumed
    And the queue "echo.beacon.reflect" is not consumed

  Scenario: A request for an operation the component does not serve is answered at once

    A caller upgraded ahead of this component names an operation it does not have. Somebody
    is waiting for the answer, and trying the request again cannot make the operation known.

    Given I compose `echo.beacon` component
    When a request naming `absent` is published to `echo.beacon`
    Then the request is answered with the exception:
      """yaml
      code: 402
      """
