Feature: Idenity

  Background:
    Given the `identity.basic` database is empty

  Scenario: Creating new Identity with basic credentials
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      accept: application/yaml
      content-type: application/yaml
      content-length: 37

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
            dev:stub:
              access: granted!
      """
    When the following request is received:
      # user:pass
      """
      POST /users/ HTTP/1.1
      authorization: Basic dXNlcjpwYXNz
      accept: application/yaml
      content-type: application/yaml
      content-length: 14

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
      GET /${{ id }}/ HTTP/1.1
      authorization: Basic dXNlcjpwYXNz
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      access: granted!
      """
    When the following request is received:
      # valid token has been issued
      """
      GET /${{ id }}/ HTTP/1.1
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
