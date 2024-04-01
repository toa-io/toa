Feature: Basic credentials with authorities

  Scenario: Basic credentials are scoped to the authority
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

    # create basic credentials for the `one` authority
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: the.one.com
      content-type: application/yaml
      accept: application/yaml

      username: #{{ id | set one.username }}
      password: #{{ password 8 | set one.password }}
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ one.id }}
      """

    # create basic credentials for the `two` authority
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: the.two.com
      content-type: application/yaml
      accept: application/yaml

      username: #{{ id | set two.username }}
      password: #{{ password 8 | set two.password }}
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ two.id }}
      """

    # access the resource with the `one` authority
    When the following request is received:
      """
      GET /${{ one.id }}/ HTTP/1.1
      host: the.one.com
      authorization: Basic #{{ basic one }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /${{ two.id }}/ HTTP/1.1
      host: the.one.com
      authorization: Basic #{{ basic two }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

    # access the resource with the `two` authority
    When the following request is received:
      """
      GET /${{ one.id }}/ HTTP/1.1
      host: the.two.com
      authorization: Basic #{{ basic one }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /${{ two.id }}/ HTTP/1.1
      host: the.two.com
      authorization: Basic #{{ basic two }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
