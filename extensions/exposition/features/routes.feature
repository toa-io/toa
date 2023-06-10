Feature: RTD Routes

  Scenario Outline: Basic Route
    Given the `greeter` Component is running with the following manifest:
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
    When the request is sent:
      """http
      GET /examples/basic<route>
      accept: application/yaml
      """
    Then the reply is received:
      """
      200 OK
      content-type: application/vnd.toa.reply+yaml

      output: Hello
      """
    Examples:
      | route                |
      | /strict              |
      | /shortcuts/operation |
      | /shortcuts/method    |
