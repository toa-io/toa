Feature: A gateway going quiet

  While the process it runs in is quiet, the gateway keeps its port and answers every request
  `503`: a refused connection is not an answer, and the answer has to be the application's.

  Scenario: A quiet gateway answers 503, and serves again once the halt is called off
    Given the annotation:
      """yaml
      /:
        io:output: true
        anonymous: true
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the Gateway goes quiet
    And the following request is received:
      """
      GET / HTTP/1.1
      """
    Then the following reply is sent:
      """
      503 Service Unavailable
      cache-control: no-store
      """
    When the Gateway is working again
    And the following request is received:
      """
      GET / HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: A page on another origin reads a quiet gateway's 503
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the Gateway goes quiet
    And the following request is received:
      """
      POST / HTTP/1.1
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      503 Service Unavailable
      access-control-allow-origin: https://hello.world
      access-control-allow-credentials: true
      access-control-expose-headers: retry-after
      """
    When the Gateway is working again
