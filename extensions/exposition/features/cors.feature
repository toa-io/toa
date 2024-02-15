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
      access-control-allow-headers: accept, authorization, content-type
      access-control-allow-credentials: true
      access-control-max-age: 3600
      cache-control: public, max-age=3600
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

  Scenario: Errors contain CORS headers
    Given the annotation:
      """yaml
      /:
        /foo:
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      GET /bar/ HTTP/1.1
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      404 Not Found
      access-control-allow-origin: https://hello.world
      access-control-expose-headers: authorization, content-type, content-length, etag
      vary: origin
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      access-control-allow-origin: https://hello.world
      access-control-expose-headers: authorization, content-type, content-length, etag
      vary: origin
      """
