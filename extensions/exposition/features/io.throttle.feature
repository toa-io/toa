Feature: Request throttling

  Scenario: Throttle requests to a route
    Given the `echo.beacon` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:throttle:
            key: [route]
            requests: 1
            interval: 1
            cooldown: 1
          GET:
            endpoint: hello
      """
    When the following request is received:
      """
      GET /echo/beacon/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /echo/beacon/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      429 Too Many Requests
      """
