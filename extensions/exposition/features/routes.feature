Feature: RTD Routes

  Background:
    Given the Gateway is running

  Scenario Outline: Basic Routes
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
          /mehtod: greet
      """
    When the following request is received:
      """http
      GET /basic/greeter<route>
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      200 OK
      content-type: application/vnd.toa.reply+yaml

      output: Hello
      """
    Examples:
      | route                |
      | /strict              |
      | /shortcuts/operation |
      | /shortcuts/method    |
