@security
Feature: Identity Federation

  Background:
    Given the `identity.federation` database is empty
    And local IDP is running

  Scenario: Asymmetric tokens
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:31005
          aud: test
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
    # credential id is detached from the Identity
    When the following request is received:
      """
      GET /identity/federation/${{ User.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ User.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      - iss: http://localhost:31005
        id: ${{ User.credential }}
      """

  Scenario: Creating an Identity using inception
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:31005
          aud: test
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
    # check that both tokens authenticate the created user's Identity
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
      roles: []
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
      roles: []
      """
    # credential id is detached from the Identity
    When the following request is received:
      """
      GET /identity/federation/${{ Bill.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bill.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

        iss: http://localhost:31005
        id: ${{ Bill.credential }}
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
        - iss: http://localhost:31005
          aud: test
      principal:
        authority: nex
        iss: http://localhost:31005
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

    # the Role is granted before the reply, so the Token that reply carries holds it
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
        - iss: http://localhost:31005
          aud: test
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

      scheme: bearer
      credentials: ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ Bob.credential }}
      iss: http://localhost:31005
      """
    # the created credential is listed as is
    When the following request is received:
      """
      GET /identity/federation/${{ Bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic #{{ basic Bob }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

        iss: http://localhost:31005
        id: ${{ Bob.credential }}
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
    # delete the federation credential
    When the following request is received:
      """
      DELETE /identity/federation/${{ Bob.id }}/${{ Bob.credential }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic #{{ basic Bob }}
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    # add the same federation again
    When the following request is received:
      """
      POST /identity/federation/${{ Bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic #{{ basic Bob }}
      content-type: application/yaml
      accept: application/yaml

      scheme: bearer
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
        - iss: http://localhost:31005
          aud: nex
          secret: $IDP_SECRET
      """
    And the configuration secrets:
      """yaml
      IDP_SECRET: secret
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
        - iss: http://localhost:31005
          aud: nex
          signature:
            iss: io.toa.nex.id
            kid: key-id
            key: $IDP_KEY
      """
    And the configuration secrets:
      """yaml
      IDP_KEY: |
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

  Scenario: A credential written before 1.0.0-alpha.257 authenticates as its Identity

  Up to 1.0.0-alpha.256 a credential's id was the id of its Identity, and the record held no
  `identity`. Under one issuer, two such credentials are the same key of the index that keeps an
  Identity to one credential per issuer, until each is given the Identity it stands for.

    Given the `identity.federation` database has not been migrated
    And the `identity.federation` database contains:
      | _id                              | authority | iss                    | sub     | identity                         |
      | 5ca1ab1e0000400080000000000000a1 | nex       | http://localhost:31005 | Legacy  |                                  |
      | 5ca1ab1e0000400080000000000000a2 | nex       | http://localhost:31005 | Former  |                                  |
      | fed00000000040008000000000000c01 | nex       | http://localhost:31005 | Current | 1d000000000040008000000000000c01 |
    And the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:31005
          aud: test
      """
    And the Gateway is stopped
    And the IDP token for Legacy is issued
    And the IDP token for Former is issued
    And the IDP token for Current is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Legacy.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 5ca1ab1e0000400080000000000000a1
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Former.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 5ca1ab1e0000400080000000000000a2
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Current.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 1d000000000040008000000000000c01
      """
    And the `identity.federation` collection has indexes:
      | name            | keys                                 | unique |
      | unique_identity | {"authority":1,"iss":1,"identity":1} | true   |

  Scenario: A credential written before 1.0.0-alpha.257 authenticates where the indexes were made

  A release from 1.0.0-alpha.257 on made the indexes over a database that held one such
  credential under an issuer, and recorded that it had. What gives the credential its Identity is
  applied all the same.

    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:31005
          aud: test
      """
    And the Gateway is running
    And the `identity.federation` migration `0001-identity` is not recorded
    And the `identity.federation` database contains:
      | _id                              | authority | iss                    | sub    |
      | 5ca1ab1e0000400080000000000000a1 | nex       | http://localhost:31005 | Legacy |
    And the Gateway is stopped
    And the IDP token for Legacy is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Legacy.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 5ca1ab1e0000400080000000000000a1
      """
    And the `identity.federation` migrations are recorded:
      | migration     | state |
      | 0001-identity | done  |
      | 0002-indexes  | done  |
