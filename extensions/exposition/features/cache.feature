Feature: Caching

  Scenario: Caching successful response
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          cache:control: max-age=60000
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
      cache-control: max-age=60000

      hello
      """

  Scenario: Cache-control is not added when request is unsafe
    Given the annotation:
      """yaml
      /:
        anonymous: true
        cache:control: max-age=60000
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
      cache-control: max-age=60000
      """

  Scenario: Cache-control is added without implicit modifications.
    Given the annotation:
      """yaml
      /:
        cache:exact: public, max-age=60000
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: public, max-age=60000

      hello
      """

  Scenario: Cache-control is added with implicit 'no-cache'.
    Given the annotation:
      """yaml
      /:
        cache:control: public, max-age=60000
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: public, max-age=60000, no-cache

      hello
      """

  Scenario: Cache-control is added with implicit 'private'.
    Given the annotation:
      """yaml
      /:
        cache:control: max-age=60000
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=60000, private

      hello
      """