Feature: Operations failures

  Scenario: Failed observation
    Given I compose `mongo.one` component
    When I call `mongo.one.observe` with:
      """yaml
      query:
        id: 953c83b370f940408b2a2a924d2b4449
      """
    Then the reply is received:
      """yaml
      null
      """

  Scenario: Failed transition
    Given I compose `mongo.one` component
    When I call `mongo.one.transit` with:
      """yaml
      query:
        id: 953c83b370f940408b2a2a924d2b4449
      input:
        bar: hello
      """
    Then the following exception is thrown:
      """yaml
      code: 302
      """

  Scenario: Sending a Query to the Effect
    Given I compose `echo.beacon` component
    When I call `echo.beacon.echo` with:
      """yaml
      query:
        id: 953c83b370f940408b2a2a924d2b4449
      input: hello
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """

  Scenario: Thrown exception
    Given I compose `echo.beacon` component
    When I call `echo.beacon.throw` with:
      """yaml
      input: hello
      """
    Then the following exception is thrown:
      """yaml
      message: hello
      """
