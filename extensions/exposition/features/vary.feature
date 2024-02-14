Feature: The Vary directive family

  Scenario Outline: Embedding a `<result>` language code
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          vary:languages: [en, fr]
          GET:
            vary:embed:
              name: language  # embed resolved language code as a `name` property of the operation input
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
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
          GET:
            anonymous: true
            vary:embed:
              name: language  # embed resolved language code as a `name` property of the operation input
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      accept: application/yaml
      accept-language: fr
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      content-language: fr
      vary: accept-language, accept

      Hello fr
      """


  Scenario: Embedding a value of an arbitrary header
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET:
            vary:embed:
              name: :foo
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
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

  Scenario Outline: Embedding a value from the list of options
    Given the `echo` is running with the following manifest:
        """yaml
        exposition:
          /:
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

  Scenario: Adding headers used by defined embeddings to CORS permissions
    Given the `echo` is running with the following manifest:
        """yaml
        exposition:
          /:
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
        origin: http://example.com
        access-control-request-headers: whatever
        """
    Then the following reply is sent:
        """
        204 No Content
        access-control-allow-headers: accept, content-type, accept-language, foo, bar
        """
