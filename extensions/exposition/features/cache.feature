Feature: Caching

  Scenario: Caching successful response
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          cache:control: public, no-cache, max-age=60000
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: public, no-cache, max-age=60000

      hello
      """

  Scenario: Cache-control is not added when request is unsafe
    Given the annotation:
      """yaml
      /:
        anonymous: true
        cache:control: public, no-cache, max-age=60000
        POST:
          dev:stub: hello
      """
    When the following request is received:
      """
      POST / HTTP/1.1
      accept: application/yaml
      """
    Then the reply does not contain:
      """
      cache-control: public, no-cache, max-age=60000
      """

  # TODO: add scenarios for implicit modifications
