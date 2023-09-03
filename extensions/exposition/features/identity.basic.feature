Feature: Idenity

  Background:
    Given the `identity.basic` database is empty

  Scenario: Creating new Identity with basic credentials
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      accept: application/yaml
      content-type: application/yaml

      username: developer
      password: secret
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      output:
        id:
      """

  Scenario: Creating new Identity using inception
    Given the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          anonymous: true
          POST:
            incept: id
            endpoint: transit
        /:id:
          id: id
          GET: observe
      """
    When the following request is received:
      # user:pass
      """
      POST /users/ HTTP/1.1
      authorization: Basic dXNlcjpwYXNz
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      output:
        id: ${{ id }}
      """
    When the following request is received:
      # basic credentials have been created
      """
      GET /users/${{ id }}/ HTTP/1.1
      authorization: Basic dXNlcjpwYXNz
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      # valid token has been issued
      """
      GET /users/${{ id }}/ HTTP/1.1
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Changing the password
    Given the annotation:
      """
      /:id:
        id: id
        GET:
          dev:stub:
            access: granted!
      """
    And the `identity.basic` database contains:
      # developer:secret
      | _id                              | _version | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | 1        | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    When the following request is received:
      """
      PATCH /identity/basic/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/yaml

      password: new-secret
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      # old password
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      # new password
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOm5ldy1zZWNyZXQ=
      """
    Then the following reply is sent:
      """
      200 OK
      """
