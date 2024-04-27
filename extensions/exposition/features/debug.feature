Feature: Debugging

  Scenario: Operation call
    Given the annotation:
    """yaml
    debug: true
    """
    Given the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: greet
      """
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
