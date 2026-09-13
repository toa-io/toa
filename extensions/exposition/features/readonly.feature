Feature: A safe method writes nothing

  `GET` and `HEAD` may only read. What they reach is held to that, and so is everything it reaches
  in turn; a route that serves a safe method with an operation that writes says so.

  Background:
    Given the `pots` database contains:
      | _id                              | title     | volume | temperature |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot | 100    | 80          |

  Scenario: A safe method may not reach an operation that writes
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          GET: terminate
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      500 Internal Server Error
      """

  Scenario: So may not HEAD, which is served by the same method
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          GET: terminate
      """
    When the following request is received:
      """
      HEAD /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      500 Internal Server Error
      """

  Scenario: Any other method reaches it
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          DELETE: terminate
      """
    When the following request is received:
      """
      DELETE /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 4c4759e6f9c74da989d64511df42d6f4
      """

  Scenario: A method that says otherwise reaches it
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          GET:
            endpoint: terminate
            io:readonly: false
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 4c4759e6f9c74da989d64511df42d6f4
      """

  Scenario: A node says it for the methods under it
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        io:readonly: false
        /:id:
          io:output: true
          GET: terminate
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 4c4759e6f9c74da989d64511df42d6f4
      """

  Scenario: A method that only reads may write nothing further down
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          GET: purge
          POST: purge
      """
    # the method is mapped to an observation, which is safe; what the observation calls is not
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      500 Internal Server Error
      """
    # the same chain, asked for by a method that may write
    When the following request is received:
      """
      POST /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      id: 4c4759e6f9c74da989d64511df42d6f4
      """

  # a procedure is the method it names, so it may only read for the same reason
  Scenario: A procedure named for a safe verb may not write
    Given the annotation:
      """yaml
      rpc: {}
      """
    And the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          GET: terminate
      """
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "pots._id.GET",
       "params": {"id": "4c4759e6f9c74da989d64511df42d6f4"}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 1
      error:
        code: -32603
      """

  # so does whoever is told about the method, a model that may call a read-only tool unasked
  # among them
  Scenario: A method that says otherwise describes itself so
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: true
          GET:
            endpoint: terminate
            io:readonly: false
      """
    When the following request is received:
      """
      OPTIONS /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      GET:
        readonly: false
      """
