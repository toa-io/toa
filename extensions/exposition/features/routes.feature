Feature: RTD Routes

  Background:
    Given the Service is running

  Scenario Outline: Basic Routes
    Given the `greeter` is running with the following manifest:
      """yaml
      namespace: basic

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
      GET /basic/greeter<route>
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
