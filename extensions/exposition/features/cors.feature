@security
Feature: CORS Support

  Scenario: A preflight permits everything a later request may ask for
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
      OPTIONS /foo/ HTTP/1.1
      access-control-request-method: GET
      access-control-request-headers: content-type
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-headers: *, authorization
      access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, LOCK, UNLOCK, OPTIONS
      access-control-allow-origin: *
      access-control-max-age: 86400
      """
    And the reply does not contain:
      """
      access-control-allow-credentials:
      """
    And the reply does not contain:
      """
      vary:
      """
    And the reply does not contain:
      """
      cache-control:
      """

  Scenario: A reply is readable from any origin
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
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      200 OK
      access-control-allow-origin: *
      access-control-expose-headers: *
      """
    And the reply does not contain:
      """
      access-control-allow-credentials:
      """

  Scenario: A reply does not depend on the origin
    A cache keeps one copy of a reply for every origin, so the copy made for a request that
    names none has to be readable by a page.

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
      access-control-allow-origin: *
      access-control-expose-headers: *
      """
    And the reply does not contain:
      """
      vary: origin
      """

  Scenario: An OPTIONS that is not a preflight
    A preflight is `OPTIONS` carrying `Access-Control-Request-Method`, and only that. A
    browser puts `Origin` on every request whose method is not `GET` or `HEAD`, its own
    `OPTIONS` included — so one answered as a preflight is a resource no page can introspect.

    Given the annotation:
      """yaml
      /:
        anonymous: true
        /foo:
          io:output: true
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      OPTIONS /foo/ HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      access-control-allow-origin: *
      access-control-expose-headers: *
      Allow: GET
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
      access-control-allow-origin: *
      access-control-expose-headers: *
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
      access-control-allow-origin: *
      access-control-expose-headers: *
      """

  Scenario: A request the gateway does not route has CORS headers
    When the following request is received:
      """
      COPY / HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      501 Not Implemented
      access-control-allow-origin: *
      access-control-expose-headers: *
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex_toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      400 Bad Request
      access-control-allow-origin: *
      access-control-expose-headers: *
      """
