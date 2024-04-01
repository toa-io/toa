@security
Feature: Basic authentication

  Background:
    Given the `identity.basic` database is empty

  Scenario: Creating new Identity with basic credentials
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      username: developer
      password: secret#1234
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      username: developer
      password: secret#1234
      """
    Then the following reply is sent:
      """
      409 Conflict
      """

  Scenario: Creating new Identity using inception
    Given the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          anonymous: true     # checking compatibility with anonymous access
          POST:
            incept: id
            endpoint: transit
            query: ~
          /:id:                 # credential testing route
            id: id
            GET: observe
      """
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
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
    When the following request is received:
      # basic credentials have been created
      """
      GET /users/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      # valid token has been issued
      """
      GET /users/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
    # username is taken
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjphbm90aGVycGFzczEyMzQ=
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      409 Conflict
      """
    # credentials already exists
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Changing the password
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
    And the `identity.basic` database contains:
      | _id                              | _version | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | 1        | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    When the following request is received:
      """
      PATCH /identity/basic/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
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
      host: nex.toa.io
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
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOm5ldy1zZWNyZXQ=
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Changing other identity's password
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     | _version |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O | 1        |
      | 6c0be50cbfb043acafe69cc7d3895f84 | nex       | attacker  | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O | 1        |
    When the following request is received:
      """
      PATCH /identity/basic/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic YXR0YWNrZXI6c2VjcmV0
      accept: application/yaml
      content-type: application/yaml

      password: new-secret
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario Outline: <problem> not meeting the requirements
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      username: <username>
      password: <password>
      """
    Then the following reply is sent:
      """
      409 Conflict

      code: <code>
      message: <problem> is not meeting the requirements.
      """
    Examples:
      | username                                                                                                                          | password    | problem  | code             |
      | zYF8G6obtE3c5ARpZjnMwv0L7lX2dQUyJ1KiHS9ag4fThDPVxCsuIWmNeBqkOrzYF8G6obtE3c5ARpZjnMwv0L7lX2dQUyJ1KiHS9ag4fThDPVxCsuIWmNeBqkOris129 | secret#1234 | Username | INVALID_USERNAME |
      | root                                                                                                                              | short       | Password | INVALID_PASSWORD |

  Scenario Outline: <property> is not meeting one of requirements
    Given the `identity.basic` configuration:
      """yaml
      <property>:
        - ^\S{1,16}$
        - ^[^A]{1,16}$  # should not contain 'A'
      """
    And the `identity.basic` database contains:
      | _id                              | _version | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | 1        | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    When the following request is received:
      """
      PATCH /identity/basic/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/yaml

      <property>: hasAinside
      """
    Then the following reply is sent:
      """
      409 Conflict
      """
    Examples:
      | property |
      | username |
      | password |

  Scenario: Granting a `system` role to a Principal
    Given the `identity.basic` configuration:
      """yaml
      principal: root
      """
    And the annotation:
      """yaml
      /:
        io:output: true
        GET:
          auth:role: system:stub
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      username: root
      password: secret#1234
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    # role granting is eventual
    Then after 0.1 seconds
    When the following request is received:
      """
      GET /identity/roles/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQjMTIzNA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}

      - system
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      access: granted!
      """
    # Principal username cannot be changed
    When the following request is received:
      """
      PATCH /identity/basic/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: application/yaml
      content-type: application/yaml

      username: admin
      """
    Then the following reply is sent:
      """
      409 Conflict

      code: PRINCIPAL_LOCKED
      message: Principal username cannot be changed.
      """

  Scenario: Creating an Identity using inception with existing credentials
    Given the `identity.basic` database is empty
    And the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          anonymous: true
          POST:
            incept: id
            endpoint: transit
      """
    When the following request is received:
      # identity inception
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      201 Created
      """
    And the following request is received:
      # same credentials
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      content-type: text/plain

      name: Mary Louis
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
