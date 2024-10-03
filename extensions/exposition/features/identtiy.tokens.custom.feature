@security
Feature: Custom tokens

  Background:
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role      |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | efe3a65ebbee47ed95a73edd911ea328 | app:notes |
    And the `identity.keys` database is empty
    And the annotation:
      """yaml
      /:
        /notes:
          auth:role: app:notes
          GET:
            io:output: true
            dev:stub:
              access: granted!
          POST:
            io:output: true
            dev:stub:
              access: granted!
          /public:
            GET:
              auth:role: app:notes:public
              io:output: true
              dev:stub:
                access: granted!
      """

  Scenario: Issuing a token
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

      kid: ${{ kid }}
      exp: ${{ exp }}
      token: ${{ token }}
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: efe3a65ebbee47ed95a73edd911ea328
      """

    # debug LRU cache
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Token with restricted scopes
    When the following request is received:
      """
      POST /identity/tokens/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/yaml

      label: Production token
      lifetime: 0
      scopes: [app:notes:public]
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      GET /notes/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      """
      GET /notes/public/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Token with restricted permissions
    When the following request is received:
      """
      POST /identity/tokens/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/yaml

      label: Restricted token
      lifetime: 0
      permissions: {
        /notes/: [GET]
      }
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      GET /notes/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

    # method is not permitted
    When the following request is received:
      """
      POST /notes/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

    # resource is not permitted
    When the following request is received:
      """
      GET /notes/public/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Token revocation
    Given the `identity.tokens` configuration:
      """yaml
      cache:
        ttl: 1
      """
    When the following request is received:
      """
      POST /identity/tokens/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/yaml

      label: One-time token
      lifetime: 60
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: efe3a65ebbee47ed95a73edd911ea328
      """
    When the following request is received:
      """
      GET /identity/keys/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      - id: ${{ kid }}
        label: One-time token
        expires: ${{ expires }}
        _created: ${{ created }}
      """
    When the following request is received:
      """
      DELETE /identity/keys/efe3a65ebbee47ed95a73edd911ea328/${{ kid }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      """
    And after 1 second
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
