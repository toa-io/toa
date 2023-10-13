Feature: Directives

  Scenario: Basic directive
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          dev:stub:
            hello: world
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/json
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/json

      {"hello":"world"}
      """

  Scenario: Nested routes
    Given the annotation:
      """yaml
      /:
        anonymous: true
        dev:stub:
          hello: again
        GET: {}
        /pots:
          GET: {}
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      hello: again
      """
    When the following request is received:
      """
      GET /pots/non-existent/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
