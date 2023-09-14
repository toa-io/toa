Feature: Routes

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
      """
    When the following request is received:
      """
      GET /basic/greeter<route> HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello
      """
    Examples:
      | route                 |
      | /strict/              |
      | /shortcuts/operation/ |

  Scenario: Basic routes within default namespace
    Given the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET: greet
      """
    When the following request is received:
      """
      GET /greeter/ HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello
      """
