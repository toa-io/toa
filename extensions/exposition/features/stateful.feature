Feature: Stateful operations

  A route reaches a stateful operation on the process whose name it carries.

  Scenario: A route reaches the process its segment names
    Given the `counter` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            anonymous: true
            endpoint: whoami
        /:instance:
          io:output: true
          GET:
            anonymous: true
            map:instance: instance
            endpoint: whereami
      """
    When the following request is received:
      """
      GET /counter/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      instance: ${{ instance }}
      """
    When the following request is received:
      """
      GET /counter/${{ instance }}/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      instance: ${{ instance }}
      """

  Scenario: A name nobody holds answers 404
    Given the `counter` is running with the following manifest:
      """yaml
      exposition:
        /:instance:
          io:output: true
          GET:
            anonymous: true
            map:instance: instance
            endpoint: whereami
      """
    When the following request is received:
      """
      GET /counter/nobody/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: A stateful operation behind a route that carries no name answers 400
    Given the `counter` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            anonymous: true
            endpoint: whereami
      """
    When the following request is received:
      """
      GET /counter/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """
