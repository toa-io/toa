Feature: OIDC tokens with authorities

  Background:
    Given local IDP is running
    And the `identity.federation` database is empty
    And the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      implicit: true
      """


  Scenario: OIDC tokens are scoped to authorities
    Given the annotation:
      """yaml
      authorities:
        one: the.one.com
      /:
        /:id:
          auth:id: id
          GET:
            dev:stub: Hello
      """
    And the IDP token for One is issued
    And the IDP token for Two is issued

    # create identities
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: the.one.com
      authorization: Bearer ${{ One.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ One.id }}
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Bearer ${{ Two.id_token }}
      host: the.two.com
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

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

    # authorization will create new identity within `one` authority
    When the following request is received:
      """
      GET /${{ Two.id }}/ HTTP/1.1
      host: the.one.com
      authorization: Bearer ${{ Two.id_token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
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
      403 Forbidden
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
