Feature: OIDC tokens with authorities

  Scenario: OIDC tokens are scoped to authorities
    Given the annotation:
      """yaml
      authorities:
        one: the.one.com
        two: the.two.com
      /:
        /:id:
          auth:id: id
          GET:
            dev:stub: Hello
      """
    And local IDP is running
    And the `identity.federation` database is empty
    And the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """
    And the IDP token for One is issued
    And the IDP token for Two is issued

    # create identities
    When the following request is received:
      """
      POST /identity/federation/ HTTP/1.1
      host: the.one.com
      accept: application/yaml
      content-type: application/yaml

      credentials: ${{ One.id_token }}
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ One.id }}
      """
    When the following request is received:
      """
      POST /identity/federation/ HTTP/1.1
      host: the.two.com
      accept: application/yaml
      content-type: application/yaml

      credentials: ${{ Two.id_token }}
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ Two.id }}
      """

    # access `one` authority
    When the following request is received:
      """
      GET /${{ One.id }}/ HTTP/1.1
      host: the.one.com
      authorization: Bearer ${{ One.id_token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /${{ Two.id }}/ HTTP/1.1
      host: the.one.com
      authorization: Bearer ${{ Two.id_token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

    # access `two` authority
    When the following request is received:
      """
      GET /${{ One.id }}/ HTTP/1.1
      host: the.two.com
      authorization: Bearer ${{ One.id_token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /${{ Two.id }}/ HTTP/1.1
      host: the.two.com
      authorization: Bearer ${{ Two.id_token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
