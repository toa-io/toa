Feature: Directives

  Scenario: Basic directive
    Given the annotation:
      """yaml
      /:
        dev:stub:
          hello: world
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      hello: world
      """
