Feature: A component's contract comes from the version that is running

  The gateway reads what an operation takes from the component, and holds a caller to it. A
  component whose routes do not change still changes what it takes, and the gateway is serving
  the routes of whichever version announced them last.

  Scenario: An operation's input changes while its routes do not
    Given the components answer over the broker
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: compute
      operations:
        compute:
          input:
            properties:
              name:
                maxLength: 5
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      content-type: application/json

      { "name": "world" }
      """
    Then the following reply is sent:
      """
      201 Created

      Hello world
      """
    Given the `echo` is stopped
    # the same routes, and an operation that now takes a longer name
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: compute
      operations:
        compute:
          input:
            properties:
              name:
                maxLength: 50
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      content-type: application/json

      { "name": "worldwide" }
      """
    Then the following reply is sent:
      """
      201 Created

      Hello worldwide
      """

  Scenario: The contract is the announcing version's, whatever the map states
    Given the components answer over the broker
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: compute
      operations:
        compute:
          input:
            properties:
              name:
                maxLength: 5
      """
    And the component map states the `echo` that is running
    And the `echo` is stopped
    # the same routes, from a version the map does not state
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: compute
      operations:
        compute:
          input:
            properties:
              name:
                maxLength: 50
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      content-type: application/json

      { "name": "worldwide" }
      """
    Then the following reply is sent:
      """
      201 Created

      Hello worldwide
      """
