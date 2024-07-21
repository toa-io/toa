Feature: Dynamic tree updates

  Background:
    Given the `pots` database contains:
      | _id                              | title     | volume | temperature |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot | 100    | 80          |

  Scenario: Updating routes
    Given the Gateway is running
    And the `pots` is running with the following manifest:
      """yaml
      version: 1
      exposition:
        /:
          io:output: true
          isolated: true
          GET: enumerate
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    Then the `pots` is stopped
    Then the `pots` is running with the following manifest:
      """yaml
      version: 2
      exposition:
        /:
          io:output: true
          GET: enumerate
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Repeat routes
    Given the Gateway is running
    And the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: enumerate
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Then the `pots` is stopped
    And the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: enumerate
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Updating routes with conflict
    And the `pots` is running with the following manifest:
      """yaml
      version: 1.0.0
      exposition:
        /:id:
          io:output: true
          GET: observe
      """
    Then the `pots` is stopped
    Then the `pots` is running with the following manifest:
      """yaml
      version: 1.1.0
      exposition:
        /:
          io:output: true
          /:id:
            GET: observe
          /big:
            GET:
              endpoint: enumerate
              query:
                criteria: volume>200
      """
    When the following request is received:
      """
      GET /pots/big/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Updating method mapping
    Given the `pots` is running with the following manifest:
      """yaml
      version: a
      exposition:
        /big:
          io:output: true
          GET:
            endpoint: enumerate
            query:
              criteria: volume>200 # closed
      """
    Then the `pots` is stopped
    Then the `pots` is running with the following manifest:
      """yaml
      version: b
      exposition:
        /big:
          io:output: true
          GET:
            endpoint: enumerate
            query:
              criteria: volume>200; # open
      """
    When the following request is received:
      """
      GET /pots/big/?criteria=temperature>50 HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """
