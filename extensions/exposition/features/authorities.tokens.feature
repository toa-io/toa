Feature: Token credentials with authorities

  Scenario: Tokens are scoped to authorities
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

    # create identity within the `one` authority
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: the.one.com
      content-type: application/yaml
      accept: application/yaml

      username: #{{ id | set one.username }}
      password: '#{{ password 8 | set one.password }}'
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: the.one.com
      accept: application/yaml
      authorization: Basic #{{ basic one }}
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ one.token }}

      id: ${{ one.id }}
      """

    # create identity within the `two` authority
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: the.two.com
      content-type: application/yaml
      accept: application/yaml

      username: #{{ id | set two.username }}
      password: '#{{ password 8 | set two.password }}'
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: the.two.com
      accept: application/yaml
      authorization: Basic #{{ basic two }}
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ two.token }}

      id: ${{ two.id }}
      """

    # access `one` authority
    When the following request is received:
      """
      GET /${{ one.id }}/ HTTP/1.1
      host: the.one.com
      authorization: Token ${{ one.token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /${{ two.id }}/ HTTP/1.1
      host: the.one.com
      authorization: Token ${{ two.token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

    # access `two` authority
    When the following request is received:
      """
      GET /${{ one.id }}/ HTTP/1.1
      host: the.two.com
      authorization: Token ${{ one.token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /${{ two.id }}/ HTTP/1.1
      host: the.two.com
      authorization: Token ${{ two.token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
