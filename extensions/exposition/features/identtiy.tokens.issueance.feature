Feature: Manual token issuance

  Background:
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role      |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | efe3a65ebbee47ed95a73edd911ea328 | app:notes |
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

  Scenario: Issuing token
    When the following request is received:
      """
      POST /identity/tokens/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml
      accept: application/json

      lifetime: 0
      """
    Then the following reply is sent:
      """
      201 Created

      "${{ token }}"
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

  Scenario: Token with restricted scopes
    When the following request is received:
      """
      POST /identity/tokens/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/json
      content-type: application/yaml

      lifetime: 10
      scopes: [app:notes:public]
      """
    Then the following reply is sent:
      """
      201 Created

      "${{ token }}"
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
      POST /identity/tokens/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/json
      content-type: application/yaml

      lifetime: 10
      permissions: {
        /notes/: [GET]
      }
      """
    Then the following reply is sent:
      """
      201 Created

      "${{ token }}"
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
