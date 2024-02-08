Feature: CORS Support

  Scenario: Using CORS
    Given the annotation:
      """yaml
      /:
        anonymous: true
        /foo:
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      OPTIONS / HTTP/1.1
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-origin: https://hello.world
      access-control-allow-methods: GET, POST, PUT, PATCH, DELETE
      access-control-allow-headers: accept, content-type
      access-control-allow-credentials: true
      access-control-max-age: 86400
      vary: origin
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      200 OK
      access-control-allow-origin: https://hello.world
      access-control-expose-headers: authorization, content-type, content-length, etag
      vary: origin
      """
