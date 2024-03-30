Feature: The Vary directive family

  Scenario Outline: Embedding a `<result>` language code
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          vary:languages: [en, fr]
          GET:
            vary:embed:
              name: language  # embed resolved language code as a `name` property of the operation input
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      accept-language: <accept>
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      content-language: <result>
      vary: accept-language, accept

      Hello <result>
      """
    Examples:
      | accept | result |
      | en     | en     |
      | en_US  | en     |
      | fr     | fr     |
      | sw     | en     |

  Scenario: Listing languages on the root
    Given the annotation:
    """
    /:
      vary:languages: [en, fr]
    """
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            anonymous: true
            vary:embed:
              name: language
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      accept-language: fr
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      content-language: fr
      """

  Scenario: Embedding a value of an arbitrary header
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            vary:embed:
              name: :foo
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      foo: bar
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      vary: foo, accept

      Hello bar
      """

  Scenario: Embedding a `host` header value
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            vary:embed:
              name: :Host
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      foo: bar
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      vary: accept

      Hello 127.0.0.1:8000
      """

  Scenario Outline: Embedding a value from the list of options
    Given the `echo` is running with the following manifest:
        """yaml
        exposition:
          /:
            io:output: true
            vary:languages: [en, fr]
            GET:
              vary:embed:
                name:
                  - :foo
                  - :bar
                  - language
              endpoint: compute
        """
    When the following request is received:
        """
        GET /echo/ HTTP/1.1
      host: nex.toa.io
        accept: application/yaml
        <header>: <value>
        """
    Then the following reply is sent:
        """
        200 OK
        content-type: application/yaml
        vary: <header>, accept

        Hello <value>
        """
    Examples:
      | header          | value |
      | foo             | bar   |
      | bar             | baz   |
      | accept-language | en    |

  Scenario: Embedding route parameter
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:friend:
          io:output: true
          GET:
            vary:embed:
              name: /:friend
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/Ken/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello Ken
      """

  Scenario: Adding headers used by defined embeddings to CORS permissions
    Given the `echo` is running with the following manifest:
        """yaml
        exposition:
          /:
            io:output: true
            vary:languages: [en, fr]
            GET:
              vary:embed:
                name:
                  - language
                  - :foo
                  - :FOO
                  - :bar
              endpoint: compute
        """
    When the following request is received:
        """
        OPTIONS / HTTP/1.1
      host: nex.toa.io
        origin: https://example.com
        access-control-request-headers: whatever
        """
    Then the following reply is sent:
        """
        204 No Content
        access-control-allow-headers: accept, authorization, content-type, etag, if-match, if-none-match, accept-language, foo, bar
        """
