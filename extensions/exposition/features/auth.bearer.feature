@security
Feature: More than one provider claims Bearer

  An OpenID `id_token` and a token this gateway issued are both presented as `Bearer`,
  and only their own provider can verify either. The gateway asks each in turn.

  Background:
    Given local IDP is running
    And the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the annotation:
      """yaml
      /:
        io:output: true
        /hello/:id:
          auth:id: id
          GET:
            dev:stub: Hello
      """

  Scenario: A token this gateway issued is presented as Bearer
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
    When the following request is received:
      """
      GET /hello/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ token }}
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain

      Hello
      """
    # the token was answered by its own provider, so nothing rotates it
    And the reply does not contain:
      """
      authorization: Token
      """

  Scenario: A Bearer this gateway did not issue is answered by federation
    Given the IDP token for Stranger is issued
    When the following request is received:
      """
      GET /hello/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Stranger.id_token }}
      accept: text/plain
      """
    # `identity.tokens` declines it, and federation rejects an issuer it does not trust
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: A malformed Bearer is rejected, not an error
    When the following request is received:
      """
      GET /hello/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer not.a.token
      accept: text/plain
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Both kinds of Bearer against one authority
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
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
      authorization: Token ${{ federated }}

      id: ${{ User.id }}
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ federated }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ User.id }}
      """
