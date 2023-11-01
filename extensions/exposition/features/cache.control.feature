Feature: Cache control directive

  @cache-control
  Scenario: Default behavior
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          cache:control: public, no-cache, max-age=60000
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
      cache-control: public, no-cache, max-age=60000
      """

  @cache-control
  Scenario: Unsafe methods
    Given the annotation:
      """yaml
      /:
        anonymous: true
        cache:control: public, no-cache, max-age=60000
        GET: {}
        POST: {}
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      cache-control: public, no-cache, max-age=60000
      """
    When the following request is received:
      """
      POST / HTTP/1.1
      accept: application/yaml
      """
    Then the reply does not contain::
      """
      cache-control: public, no-cache, max-age=60000
      """

  @cache-control
  Scenario: 404 Response
    Given the annotation:
      """yaml
      /:
        anonymous: true
        cache:control:
          ok: public, no-cache, max-age=60000
          404: public, no-cache, max-age=5000
        GET: {}
      """
    When the following request is received:
      """
      GET /non-existing-route HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      content-type: application/yaml
      cache-control: public, no-cache, max-age=5000
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      cache-control: public, no-cache, max-age=60000
      """
