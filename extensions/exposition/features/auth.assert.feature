Feature: Identity assertion

  Scenario: Assert Identity
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     | _version |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O | 1        |
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET:
            auth:assert: true
            anyone: true
            io:output: true
            endpoint: ping
      """

    # existent identity
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ developer.token }}
      """

    # new identity
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYSQkdzByZCE=
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ user.token }}
      """

    # invalid credentials
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNz
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: INVALID_PASSWORD
      """
