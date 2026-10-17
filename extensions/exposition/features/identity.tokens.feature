@security
Feature: Tokens lifecycle

  Scenario: Switching to Token authentication scheme
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
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
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      content-type: text/plain

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
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      cache-control: no-store

      Hello
      """
    Then after 1 second
    When the following request is received:
      """
      GET /hello/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token
      cache-control: no-store

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
      refresh: 1
      """
    And the `identity.basic` database contains:
      | _id                              | VERSION | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | 1       | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
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
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      password: new-secret
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Then after 1.1 seconds
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Refreshing a token on request
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.roles` database is empty
    And the annotation:
      """yaml
      /:
        io:output: true
        auth:role: app:editor
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      """
    Given the `identity.roles` database contains:
      | _id                              | identity                         | role       |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | efe3a65ebbee47ed95a73edd911ea328 | app:editor |
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      """
      POST /identity/tokens/refresh/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ refreshed }}
      cache-control: no-store

      id: efe3a65ebbee47ed95a73edd911ea328
      roles:
        - app:editor
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ refreshed }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      access: granted!
      """

  Scenario: Refreshing a token issued before the revocation
    Given the `identity.basic` database contains:
      | _id                              | VERSION | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | 1       | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
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
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      password: new-secret
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      POST /identity/tokens/refresh/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Refreshing a custom token
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.keys` database is empty
    When the following request is received:
      """
      POST /identity/tokens/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml
      accept: application/yaml

      label: Dev token
      lifetime: 600
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      POST /identity/tokens/refresh/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Refreshing without credentials
    When the following request is received:
      """
      POST /identity/tokens/refresh/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
