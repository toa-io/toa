Feature: The Vary directive family

  Scenario: Embedding language
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET:
            vary:languages: [en, fr]
            vary:embed:
              language: name  # embed resolved language code as a `name` property of the operation input
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      accept: application/yaml
      accept-language: en_US
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      vary: accept, accept-language

      Hello, en!
      """
