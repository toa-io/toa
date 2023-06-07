Feature: RTD Routes

  Scenario Outline: Basic Route
    Given the `greeter` Component with the following manifest:
      """yaml
      namespace: examples

      exposition:
        /strict:
          GET:
            operation: greet
        /shortcuts:
          /operation:
            GET: greet
          /mehtod: greet
      """
    When the request is received:
      """http
      GET /examples/basic<route>
      accept: application/yaml
      """
    Then the reply is sent:
      """
      200 OK
      content-type: application/vnd.toa.reply+yaml

      reply: Hello
      """
    Examples:
      | route                |
      | /strict              |
      | /shortcuts/operation |
      | /shortcuts/method    |
