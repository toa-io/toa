Feature: Request throttling

  Scenario: Throttle requests to a path
    Given the `echo.beacon` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:throttle:
            key: [path]
            requests: 1
            interval: 1
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
    # an emission is a second, which is what the budget takes to earn one back
    Then the following reply is sent:
      """
      429 Too Many Requests
      retry-after: 1
      """
    Then after 2 seconds
    When the following request is received:
      """
      GET /echo/beacon/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Throttle requests to a route, whichever path they came in on
    Given the `echo.beacon` is running with the following manifest:
      """yaml
      exposition:
        /:
          /:id:
            io:throttle:
              key: [route]
              requests: 1
              interval: 5
            GET:
              dev:stub:
                hello: true
      """
    When the following request is received:
      """
      GET /echo/beacon/1/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
    # a different path of the same route, and the budget is already spent —
    # keyed on `path` this would be 200
    When the following request is received:
      """
      GET /echo/beacon/2/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      429 Too Many Requests
      """

  Scenario: Throttle requests per route segment
    Given the `echo.beacon` is running with the following manifest:
      """yaml
      exposition:
        /:
          /:id:
            io:throttle:
              key:
                - segment: id
              requests: 1
              interval: 5
            GET:
              dev:stub:
                hello: true
      """
    When the following request is received:
      """
      GET /echo/beacon/1/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /echo/beacon/1/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      429 Too Many Requests
      """
    # another segment value, another budget
    When the following request is received:
      """
      GET /echo/beacon/2/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Throttle requests per identity
    Given the `echo.beacon` is running with the following manifest:
      """yaml
      exposition:
        /:
          auth:anyone: true
          GET:
            # declared after `auth:` on the node, and mandatory families run in
            # their own order regardless: `auth` has to resolve the identity
            # before `io` can key a quota on it
            io:throttle:
              key: [identity]
              requests: 1
              interval: 5
            endpoint: hello
      """
    And transient identity alice
    And transient identity bob
    When the following request is received:
      """
      GET /echo/beacon/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ alice.token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /echo/beacon/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ alice.token }}
      """
    Then the following reply is sent:
      """
      429 Too Many Requests
      """
    # bob's own budget, which requires auth to have resolved him before io keyed on him
    When the following request is received:
      """
      GET /echo/beacon/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ bob.token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
