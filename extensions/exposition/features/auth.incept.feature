Feature: Identity inception

  Scenario: Non-associated Identity inception
    Given the `identity.basic` database is empty
    When the following request is received:
      """
      POST /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      id: ${{ id }}
      roles: []
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ id }}
      roles: []
      """

  Scenario: Creating new Identity using inception with Basic scheme
    Given the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            io:input: [name]
            io:output: true
            incept: id
            query: ~
            endpoint: transit
      """
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic #{{ basic }}
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      id: ${{ id }}
      """

  Scenario: Inception with operation error
    Given the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            io:input: [name]
            io:output: true
            incept: id
            endpoint: create
      """
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic #{{ basic }}
      accept: application/yaml
      content-type: application/yaml

      name: return_error
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity
      """

  Scenario: Incept without credentials
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            auth:incept: id
            io:output: true
            query: ~
            endpoint: echo
      """
    And transient identity
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      id: ${{ identity.id }}
      foo: bar
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      id: ${{ identity.id }}
      foo: bar
      """

  Scenario: Inception with a wrong password for existing credentials
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     | VERSION |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O | 1       |
    And the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            io:input: [name]
            io:output: true
            incept: id
            query: ~
            endpoint: transit
      """
    # developer:wrong
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    # a token that does not decrypt
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Token garbage
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
