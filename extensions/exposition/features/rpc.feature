Feature: JSON-RPC

  A procedure is an RTD method addressed by name: the route template with its variables
  marked, and the verb as the last segment. Nothing is declared for it — what is exposed as
  a resource is exposed as a procedure, under the same directives.

  Background:
    Given the annotation:
      """yaml
      rpc: {}
      """
    And the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          anonymous: true
          GET: enumerate
          POST: create
          /:id:
            GET: observe
          /guarded:
            isolated: true
            GET:
              auth:role: admin
              dev:stub: never
          /faulty:
            GET:
              dev:throw: nope
          /v1.0:
            GET:
              dev:stub: never
      """
    And the `pots` database contains:
      | _id                              | title     | volume |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot | 100    |

  Scenario: A variable is taken from the parameters
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "pots/_id/GET",
       "params": {"id": "4c4759e6f9c74da989d64511df42d6f4"}}
      """
    Then the following reply is sent:
      """
      200 OK
      cache-control: no-store

      jsonrpc: '2.0'
      id: 1
      result:
        id: 4c4759e6f9c74da989d64511df42d6f4
        title: First pot
        volume: 100
      """

  Scenario: What is left of the parameters is the input
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 2, "method": "pots/POST",
       "params": {"title": "Kettle", "volume": 1.7}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 2
      result:
        id:
      """

  Scenario: A query travels under a name of its own
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 3, "method": "pots/GET",
       "params": {"query": {"limit": 1}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 3
      result:
        - id: 4c4759e6f9c74da989d64511df42d6f4
      """

  Scenario: A call without an id answers nothing
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      content-type: application/json

      {"jsonrpc": "2.0", "method": "pots/POST", "params": {"title": "Pot", "volume": 1}}
      """
    Then the following reply is sent:
      """
      204 No Content
      """

  Scenario: A name nothing answers to
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 4, "method": "kettles/GET", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 4
      error:
        code: -32601
      """

  Scenario: A credential does not refuse an anonymous procedure
    What refuses a credentialed request at an `anonymous` route is that the reply would not
    be cacheable, and what a procedure answers is not a reply.

    # developer:secret
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.bans` database is empty
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 17, "method": "pots/GET", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 17
      result:
        - id: 4c4759e6f9c74da989d64511df42d6f4
      """

  Scenario: A route no name can spell
    A segment holding a `.` or a `_` has no name, so nothing addresses it — the resource
    itself is served over HTTP as it always was.

    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 16, "method": "pots/v1.0/GET", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 16
      error:
        code: -32601
      """
    When the following request is received:
      """
      GET /pots/v1.0/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: A variable the parameters do not carry
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 5, "method": "pots/_id/GET", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 5
      error:
        code: -32602
      """

  Scenario: A call that fails is a value, not a status
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 6, "method": "pots/faulty/GET", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 6
      error:
        code: -32603
      """

  Scenario: A credential is the request's, so a call cannot be refused for one
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 7, "method": "pots/guarded/GET", "params": {}}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: A request may carry several calls
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      [{"jsonrpc": "2.0", "id": 8, "method": "pots/_id/GET",
        "params": {"id": "4c4759e6f9c74da989d64511df42d6f4"}},
       {"jsonrpc": "2.0", "id": 9, "method": "kettles/GET", "params": {}},
       {"jsonrpc": "2.0", "method": "pots/POST", "params": {"title": "Pot", "volume": 1}}]
      """
    Then the following reply is sent:
      """
      200 OK

      - jsonrpc: '2.0'
        id: 8
        result:
          id: 4c4759e6f9c74da989d64511df42d6f4
          title: First pot
      - jsonrpc: '2.0'
        id: 9
        error:
          code: -32601
      """

  Scenario: What a request took is said once, whatever it carried
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      [{"jsonrpc": "2.0", "id": 13, "method": "pots/GET", "params": {}},
       {"jsonrpc": "2.0", "id": 14, "method": "pots/GET", "params": {}},
       {"jsonrpc": "2.0", "id": 15, "method": "pots/GET", "params": {}}]
      """
    Then the following reply is sent:
      """
      200 OK
      """
    # the stages of a call are measured per call, and a trace is where they are read
    And the reply does not contain:
      """
      precall
      """

  Scenario: A request of notifications alone answers nothing
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      content-type: application/json

      [{"jsonrpc": "2.0", "method": "pots/POST", "params": {"title": "One", "volume": 1}},
       {"jsonrpc": "2.0", "method": "pots/POST", "params": {"title": "Two", "volume": 2}}]
      """
    Then the following reply is sent:
      """
      204 No Content
      """

  Scenario: A request carries at least one call
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      []
      """
    Then the following reply is sent:
      """
      400 Bad Request

      jsonrpc: '2.0'
      id:
      error:
        code: -32600
      """

  Scenario: A call that is not one is answered to nobody
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "1.0", "id": 10, "method": "pots/GET"}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id:
      error:
        code: -32600
      """

  Scenario: The endpoint answers POST alone
    When the following request is received:
      """
      GET /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      405 Method Not Allowed
      allow: POST
      """

  Scenario: What a request may carry at once is bounded
    Given the annotation:
      """yaml
      rpc:
        batch: 1
      """
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      [{"jsonrpc": "2.0", "id": 11, "method": "pots/GET", "params": {}},
       {"jsonrpc": "2.0", "id": 12, "method": "pots/GET", "params": {}}]
      """
    Then the following reply is sent:
      """
      400 Bad Request

      jsonrpc: '2.0'
      id:
      error:
        code: -32002
      """

  Scenario: Nothing is served where it was not asked for
    Given the annotation:
      """yaml
      /:
        io:output: true
        anonymous: true
      """
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 9, "method": "pots/GET", "params": {}}
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
