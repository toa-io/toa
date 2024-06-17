Feature: Authorities

  Scenario: Accessing an authority
    Given the annotation:
      """yaml
      authorities:
        example: the.example.com
      /:
        anonymous: true
        GET:
          dev:stub: Hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: the.example.com
      """
    Then the following reply is sent:
      """
      200 OK
      """

    # arbitrary authorities are also allowed
    When the following request is received:
      """
      GET / HTTP/1.1
      host: the.other.com
      """
    Then the following reply is sent:
      """
      200 OK
      """
