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

  Scenario: Rejecting a malformed authority
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          dev:stub: Hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: zzz,identity==abc,authority==q
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """

  Scenario: Matching an authority regardless of case
    Given the annotation:
      """yaml
      authorities:
        example: the.example.com
      /:
        anonymous: true
        GET:
          map:authority: authority
          dev:stub: Hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: The.Example.COM
      """
    Then the following reply is sent:
      """
      200 OK
      """
