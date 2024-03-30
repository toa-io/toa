Feature: Request body

  Scenario: Creating an entity
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      """

  Scenario Outline: Path segment as input for <operation>
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:name:
          io:output: true
          GET: <operation>
      """
    When the following request is received:
      """
      GET /echo/world/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain

      Hello world
      """
    Examples:
      | operation |
      | compute   |
      | affect    |
