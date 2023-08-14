Feature: RTD Routes

  Background:
    Given the Gateway is running

  Scenario Outline: Basic routes
    Given the `greeter` is running with the following manifest:
      """yaml
      namespace: basic

      exposition:
        /strict:
          GET:
            endpoint: greet
        /shortcuts:
          /operation:
            GET: greet
          /method: greet
      """
    When the following request is received:
      """http
      GET /basic/greeter<route> HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      200 OK
      content-type: application/yaml

      output: Hello
      """
    Examples:
      | route                |
      | /strict              |
      | /shortcuts/operation |
      | /shortcuts/method    |

  Scenario: Basic routes within default namespace
    Given the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /: greet
      """
    When the following request is received:
      """http
      GET /greeter HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      200 OK
      content-type: application/yaml

      output: Hello
      """
