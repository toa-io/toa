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
      host: nex.toa.io
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
      host: nex.toa.io
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
      host: nex.toa.io
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
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      GET /greeter/foo/baz/bar/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello
      """

  Scenario: Routes with naming conflicts
    Given the `users` is running with the following manifest:
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
      host: nex.toa.io
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
      host: nex.toa.io
      content-type: application/yaml

      name: Alice
      """
    Then the following reply is sent:
      """
      201 Created
      """

  Scenario: Routes with parameters
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:a/:b:
          io:output: true
          GET: parameters
      """
    When the following request is received:
      """
      GET /echo/foo/bar/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      a: foo
      b: bar
      """

  Scenario: Route forwarding
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /show/:a/:b:
          io:output: true
          GET: parameters
        /hello: /echo/show/foo/bar
        /mirror/:a/:b: /echo/show/:a/:b
      """
    When the following request is received:
      """
      GET /echo/hello/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      a: foo
      b: bar
      """
    When the following request is received:
      """
      GET /echo/mirror/bar/baz/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      a: bar
      b: baz
      """
