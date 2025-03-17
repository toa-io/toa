@security
Feature: Identity Federation

  Background:
    Given the `identity.federation` database is empty
    And local IDP is running

  Scenario: Asymmetric tokens
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """
    And the IDP token for User is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ User.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ User.token }}

      id: ${{ User.id }}
      roles: []
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      authorization: Token ${{ User.token }}
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ User.id }}
      """
    # ensuring identity idempotency
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ User.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ User.id }}
      """

  Scenario: Creating an Identity using inception
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      assert: false
      """
    Given the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          anonymous: true
          POST:
            io:output: [id]
            auth:incept: id
            endpoint: create
      """
    And the IDP token for Bill is issued
    When the following request is received:
      # identity inception
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bill.id_token }}
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ Bill.token }}

      id: ${{ Bill.id }}
      """
    # check that both tokens corresponds to the same id
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ Bill.token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      id: ${{ Bill.id }}
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bill.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ Bill.id }}
      """
    And the following request is received:
      # same credentials
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bill.id_token }}
      content-type: application/yaml

      name: Mary Louis
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Granting a `system` role to a Principal
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      principal:
        iss: http://localhost:44444
        sub: root
      """
    And the IDP token for root is issued

    # create an identity
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ root.id_token }}
      accept: application/yaml
      content-type: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ root.token }}

      id: ${{ root.id }}
      """

    Then after 0.2 seconds

    # check the role
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      authorization: Token ${{ root.token }}
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ root.id }}
      roles:
        - system
      """

  Scenario: Adding federation to an existing identity
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """
    And the `identity.basic` database is empty

    # create an identity
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      username: #{{ id | set Bob.username }}
      password: #{{ password 8 | set Bob.password }}
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ Bob.id }}
      """

    When the IDP token for Bob is issued

    # add federation
    When the following request is received:
      """
      POST /identity/federation/${{ Bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic #{{ basic Bob }}
      content-type: application/yaml
      accept: application/yaml

      credentials: ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      201 Created
      """
    And the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bob.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ Bob.id }}
      """

  Scenario: Authorization code flow with secret
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
          aud: nex
          secret: secret
      """
    And auth code for Alice is issued for https://web.toa.io/callback/
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Code ${{ Alice.code_credentials }}
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ Alice.token }}

      id: ${{ Alice.id }}
      """

  Scenario: Authorization code flow with signature
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
          aud: nex
          signature:
            iss: io.toa.nex.id
            kid: key-id
            key: |
              -----BEGIN PRIVATE KEY-----
              MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg9x9DatwH0GZHSCo9
              TMHTVXyeY0YQ8qb73jHV2v4MsyehRANCAAQwaYlna2hSV3G/RIlNLV41lg8Pm4Kf
              HfCuKKiw3BIJTnSArAMJLSy1vYwSIMHz720mkmWTrWuQkkjvkDpZxfRv
              -----END PRIVATE KEY-----
      """
    And auth code for Bob is issued for https://web.toa.io/callback/
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Code ${{ Bob.code_credentials }}
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ Bob.token }}

      id: ${{ Bob.id }}
      """
