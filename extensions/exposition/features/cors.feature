@security
Feature: CORS Support

  Scenario: Basic CORS permissions
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
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-credentials: true
      access-control-allow-headers: accept, authorization, content-type, if-match, if-none-match, origin
      access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, LOCK, UNLOCK
      access-control-allow-origin: https://hello.world
      access-control-max-age: 3600
      cache-control: max-age=3600
      vary: origin
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      200 OK
      access-control-allow-credentials: true
      access-control-allow-origin: https://hello.world
      access-control-expose-headers: authorization, content-type, content-length, date, etag, last-modified
      vary: origin
      """

  Scenario: Always vary CORS
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
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      vary: origin
      """

  Scenario: Errors have CORS headers
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
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      404 Not Found
      access-control-allow-origin: https://hello.world
      access-control-expose-headers: authorization, content-type, content-length, date, etag, last-modified
      vary: origin
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      access-control-allow-origin: https://hello.world
      access-control-expose-headers: authorization, content-type, content-length, date, etag, last-modified
      vary: origin
      """
