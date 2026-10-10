Feature: Hello

  Scenario: Greeting by name
    When the request is sent:
      """
      GET /hello/?name=Toa HTTP/1.1
      accept: application/yaml
      """
    Then the response is received:
      """
      200 OK

      greeting: Hello, Toa!
      """
