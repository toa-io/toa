Feature: Response

  Scenario: Content negotiation
    Given the annotation:
      """yaml
      /:
        io:output: true
        GET:
          anonymous: true
          dev:stub:
            hello: world
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/json
      vary: accept

      {"hello":"world"}
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      vary: accept

      hello: world
      """

    # default is JSON
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/json
      vary: accept

      {"hello":"world"}
      """

  Scenario: Error as YAML
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: error
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity
      content-type: application/yaml

      code: CODE
      message: message
      """

  Scenario: Error as MessagePack
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: error
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/msgpack
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity
      content-type: application/msgpack
      """
    And response body contains MessagePack-encoded value:
      """yaml
      code: CODE
      message: message
      """
