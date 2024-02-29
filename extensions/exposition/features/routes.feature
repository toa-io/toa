Feature: Routes

  Scenario Outline: Basic routes
    Given the `greeter` is running with the following manifest:
      """yaml
      namespace: basic

      exposition:
        /:
          io:output: true
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
          io:output: true
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

  Scenario: Wildcard routes
    Given the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          /*:
            GET: greet
          /foo/*/bar:
            GET: greet
      """
    When the following request is received:
      """
      GET /greeter/baz/ HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello
      """
    When the following request is received:
      """
      GET /greeter/baz/qux/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      GET /greeter/foo/baz/bar/ HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello
      """

  Scenario: Routes with naming conflicts
    Given the Gateway is running
    And the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
      """
    And the `users.properties` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          GET: observe
      """
    When the following request is received:
      """
      GET /users/properties/b5534021e30042259badffbd1831e472/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      newbie: false
      """
    When the following request is received:
      """
      POST /users/ HTTP/1.1
      content-type: application/yaml

      name: Alice
      """
    Then the following reply is sent:
      """
      201 Created
      """
