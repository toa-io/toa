Feature: Tokens lifecycle

  Scenario: Switching to Token authentication scheme
    Given the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          auth:id: id
          GET: greet
      """
    When the following request is received:
      """
      GET /greeter/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      authorization: Token ${{ token }}

      output: Hello
      """

  Scenario: Refreshing stale token
    Given the `identity.tokens` configuration:
      """yaml
      refresh: 1000
      """
    And the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          auth:id: id
          GET: greet
      """
    When the following request is received:
      """
      GET /greeter/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      authorization: Token ${{ token }}

      output: Hello
      """
    Then after 1 second
    When the following request is received:
      """
      GET /greeter/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      authorization: Token

      output: Hello
      """

  Scenario: Token revocation on password change
    Given the annotation:
      """yaml
      /:id:
        id: id
        GET:
          dev:stub:
            access: granted!
      """
    And the `identity.tokens` configuration:
      """yaml
      refresh: 100
      """
    And the `identity.basic` database contains:
      # developer:secret
      | _id                              | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
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
      authorization: Token ${{ token }}
      content-type: application/yaml

      password: new-secret
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Then after 0.1 seconds
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
