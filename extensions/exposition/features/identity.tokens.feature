Feature: Tokens lifecycle

  Scenario: Switching to Token authentication scheme
    Given the `identity.basic` database contains:
      | _id                              | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    Given the annotation:
      """yaml
      /:
        io:output: true
        /hello/:id:
          auth:id: id
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      GET /hello/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      authorization: Token ${{ token }}

      Hello
      """

  Scenario: Refreshing stale token
    Given the `identity.tokens` configuration:
      """yaml
      refresh: 1
      """
    And the annotation:
      """yaml
      /:
        io:output: true
        /hello/:id:
          auth:id: id
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      GET /hello/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}

      Hello
      """
    Then after 1 second
    When the following request is received:
      """
      GET /hello/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Token ${{ token }}
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token

      Hello
      """

  Scenario: Token revocation on password change
    Given the annotation:
      """yaml
      /:
        io:output: true
        /:id:
          id: id
          GET:
            dev:stub:
              access: granted!
      """
    And the `identity.tokens` configuration:
      """yaml
      refresh: 0.1
      """
    And the `identity.basic` database contains:
      | _id                              | _version | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | 1        | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      """
    When the following request is received:
      """
      PATCH /identity/basic/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      password: new-secret
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Then after 0.2 seconds
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
