Feature: Caching

  Background:
    Given the `identity.basic` database contains:
      # developer:secret
      # user:12345
      | _id                              | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.bans` database is empty

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

  Scenario: Nested cache directives
    Given the annotation:
      """yaml
      /:
        cache:control: max-age=30000
        GET:
          anonymous: true
          dev:stub: hello
        /foo:
          auth:role: developer
          GET:
            dev:stub: hello
        /bar:
          auth:role: developer
          cache:control: max-age=60000, public
          GET:
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
      cache-control: max-age=30000

      hello
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      accept: text/plain
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=30000, private

      hello
      """
    When the following request is received:
      """
      GET /bar/ HTTP/1.1
      accept: text/plain
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=60000, public, no-cache

      hello
      """
    And the reply does not contain:
      """
      cache-control: max-age=30000, private
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
        auth:role: developer
        cache:exact: max-age=60000, public
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain

      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=60000, public

      hello
      """

  Scenario: Cache-control is added with implicit 'no-cache'.
    Given the annotation:
      """yaml
      /:
        auth:role: developer
        cache:control: max-age=60000, public
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=60000, public, no-cache

      hello
      """

  Scenario: Cache-control is added with implicit 'private'.
    Given the annotation:
      """yaml
      /:
        auth:role: developer
        cache:control: max-age=60000
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=60000, private

      hello
      """