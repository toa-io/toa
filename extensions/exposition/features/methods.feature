Feature: Supported methods

  Scenario Outline: <method> is supported
    Given the annotation:
      """yaml
      /:
        <method>:
          dev:stub:
            hello: world
      """
    And the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:
          <method>:
            dev:stub:
              hello: world
      """
    Examples:
      | method |
      | GET    |
      | POST   |
      | PUT    |
      | DELETE |
      | PATCH  |
      | LOCK   |
      | UNLOCK |

  Scenario: CORS allowed methods
    Given the annotation:
      """yaml
      /:
        GET:
          dev:stub:
            hello: world
      """
    When the following request is received:
      """
      OPTIONS / HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, LOCK, UNLOCK
      """
