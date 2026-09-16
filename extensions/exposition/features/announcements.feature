Feature: Announcements

  A component tells the gateway what it exposes when it opens, and again whenever the gateway
  asks. What a process holds to be asked on goes when the process does.

  Scenario: A gateway started after its components finds all of them

    Every component in one process answers the gateway's first ask, not one of them.

    Given the `greeter` is running before the Gateway with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          anonymous: true
          GET: greet
      """
    And the `echo` is running before the Gateway with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          anonymous: true
          POST: compute
      """
    And the Gateway is running
    When the following request is received:
      """
      GET /greeter/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      content-type: application/json

      { "name": "world" }
      """
    Then the following reply is sent:
      """
      201 Created

      Hello world
      """

  Scenario: A component that stops leaves no queue naming it

    A deployment that drops a component leaves the broker holding nothing for it.

    Given the `announcer` has no discovery queue
    And the `announcer` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          anonymous: true
          GET: greet
      """
    When the `announcer` is stopped
    Then the `announcer` has left no discovery queue
