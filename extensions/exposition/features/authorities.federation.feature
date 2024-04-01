Feature: OIDC tokens with authorities

  Scenario: OIDC tokens are scoped to authorities
    Given the `identity.federation` database is empty
    Given local IDP is running
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """
    And the IDP token for Bob is issued

    # create an identity
    When the following request is received:
      """
      POST /identity/federation/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      credentials: ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      201 OK
      """
