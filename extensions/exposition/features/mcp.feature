@security
Feature: Model Context Protocol

  A tool is a procedure a method is published as. A method says so with `mcp:tool`, whose
  value is what the tool is, and a default denies: a tree holds everything an application
  serves and most of it is machinery a model has no business reading. What a tool takes and
  answers is what the method says of itself, and what a caller may do with it is what `auth`
  says.

  What a tool is, is stated on the route and nowhere else. The operation states what it is
  too, and that is not this: one operation mounted on two routes is two tools. A `title`
  beside the description is what a person is shown where a client lists what it may call.

  Two revisions are answered from one endpoint that remembers nothing between requests: the
  modern one, where every request carries its own version and capabilities, and the one
  before it, which opens with `initialize`. Neither is given a session, and neither is given
  a stream.

  Background:
    Given the annotation:
      """yaml
      mcp:
        name: Teapots
        instructions: A pot is read by its id.
        anonymous: true
      """
    And the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, title, volume]
          GET:
            mcp:tool: All the pots, newest first.
            endpoint: enumerate
          POST:
            mcp:tool: Start a new pot brewing.
            endpoint: create
          /:id:
            GET:
              mcp:tool: One pot, by its id.
              endpoint: observe
          /large:
            GET:
              query:
                criteria: volume>=100
              mcp:tool:
                title: Large pots
                description: The pots that hold a hundred or more, newest first.
              endpoint: enumerate
          /unpublished:
            GET: enumerate
          /guarded:
            isolated: true
            GET:
              auth:role: admin
              mcp:tool: Every pot there is, for whoever may see them all.
              endpoint: enumerate
      """
    And the `pots` database contains:
      | _id                              | title     | volume |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot | 100    |

  Scenario: What the server is
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: server/discover

      {"jsonrpc": "2.0", "id": 1, "method": "server/discover",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK
      cache-control: no-store

      jsonrpc: '2.0'
      id: 1
      result:
        supportedVersions:
          - '2026-07-28'
          - '2025-11-25'
        capabilities:
          tools: {}
        instructions: A pot is read by its id.
        ttlMs: 1800000
        cacheScope: public
        resultType: complete
      """

  Scenario: What a client of an earlier revision opens with
    No session is made, and none is named back.

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "initialize",
       "params": {"protocolVersion": "2025-11-25", "capabilities": {},
                  "clientInfo": {"name": "Inspector", "version": "2.5.0"}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 1
      result:
        protocolVersion: '2025-11-25'
        capabilities:
          tools: {}
        serverInfo:
          name: Teapots
        instructions: A pot is read by its id.
      """
    And the reply does not contain:
      """
      mcp-session-id
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      content-type: application/json

      {"jsonrpc": "2.0", "method": "notifications/initialized"}
      """
    Then the following reply is sent:
      """
      202 Accepted
      """

  Scenario: What the tools are
    Every method that is published and the caller may reach. One the caller may not, and
    one that is published as nothing at all, are both absent.

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/list

      {"jsonrpc": "2.0", "id": 2, "method": "tools/list",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 2
      result:
        tools:
          - name: pots.GET
            description: All the pots, newest first.
            inputSchema:
              type: object
              properties:
                query:
                  type: object
                  properties:
                    criteria:
                      type: string
                    limit:
                      type: integer
                      minimum: 1
                      maximum: 100
                      default: 10
              additionalProperties: false
            annotations:
              readOnlyHint: true
          - name: pots.POST
            description: Start a new pot brewing.
            inputSchema:
              type: object
              properties:
                title:
                  type: string
                  maxLength: 64
                volume:
                  type: number
              required:
                - title
                - volume
              additionalProperties: false
          - name: pots._id.GET
            description: One pot, by its id.
            inputSchema:
              type: object
              properties:
                id:
                  type: string
              required:
                - id
              additionalProperties: false
          - name: pots.large.GET
            title: Large pots
            description: The pots that hold a hundred or more, newest first.
            annotations:
              readOnlyHint: true
        ttlMs: 1800000
        cacheScope: private
        resultType: complete
      """
    And the reply does not contain:
      """
      pots.guarded.GET
      """
    And the reply does not contain:
      """
      pots.unpublished.GET
      """
    And the reply does not contain:
      """
      Put a pot on to brew.
      """

  Scenario: A method that is published as nothing is not called by guessing its name
    A route the application did not publish is served over HTTP exactly as before. What it
    does not have is a name here, and naming it anyway reaches nothing.

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: pots.unpublished.GET

      {"jsonrpc": "2.0", "id": 30, "method": "tools/call",
       "params": {"name": "pots.unpublished.GET", "arguments": {},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      404 Not Found

      jsonrpc: '2.0'
      id: null
      error:
        code: -32601
      """

  Scenario: A credential does not hide an anonymous tool
    A client here always presents one, and what refuses a credentialed request at an
    `anonymous` route is that the reply would not be cacheable — which a tool's is not.

    # developer:secret
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.bans` database is empty
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/list

      {"jsonrpc": "2.0", "id": 20, "method": "tools/list",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 20
      result:
        tools:
          - name: pots.GET
      """

  Scenario: A tool takes what the procedure takes
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: pots._id.GET

      {"jsonrpc": "2.0", "id": 3, "method": "tools/call",
       "params": {"name": "pots._id.GET",
                  "arguments": {"id": "4c4759e6f9c74da989d64511df42d6f4"},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 3
      result:
        structuredContent:
          id: 4c4759e6f9c74da989d64511df42d6f4
          title: First pot
          volume: 100
        resultType: complete
      """

  Scenario: What is left of the arguments is the input
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: pots.POST

      {"jsonrpc": "2.0", "id": 4, "method": "tools/call",
       "params": {"name": "pots.POST", "arguments": {"title": "Kettle", "volume": 1.7},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 4
      result:
        structuredContent:
          id:
      """

  Scenario: A name nothing answers to

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: kettles.GET

      {"jsonrpc": "2.0", "id": 5, "method": "tools/call",
       "params": {"name": "kettles.GET", "arguments": {},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: A method this server does not answer
    The status is what tells a client that this endpoint is here and the method is not.

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: prompts/list

      {"jsonrpc": "2.0", "id": 6, "method": "prompts/list",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      404 Not Found

      jsonrpc: '2.0'
      id: 6
      error:
        code: -32601
      """

  Scenario: A header saying one thing and a body another
    What routes a request and what answers it must not be told two different things.

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: pots.GET

      {"jsonrpc": "2.0", "id": 7, "method": "tools/call",
       "params": {"name": "pots.POST", "arguments": {},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      400 Bad Request

      jsonrpc: '2.0'
      id: 7
      error:
        code: -32020
      """

  Scenario: A revision neither served
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 1900-01-01
      mcp-method: tools/list

      {"jsonrpc": "2.0", "id": 8, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      400 Bad Request

      jsonrpc: '2.0'
      id: 8
      error:
        code: -32022
        data:
          supported:
            - '2026-07-28'
            - '2025-11-25'
          requested: '1900-01-01'
      """

  Scenario: What the endpoint does not serve
    A stream is what these were for, and this endpoint has none.

    When the following request is received:
      """
      GET /.mcp HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      405 Method Not Allowed
      allow: POST
      """

  Scenario: Without the annotation nothing answers there
    Given the annotation:
      """yaml
      {}
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      content-type: application/json

      {"jsonrpc": "2.0", "id": 9, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: A tool the caller may not call
    What `auth` makes of a call is a refusal of the call, not of the credential: the model
    named a record that is not the caller's, which it may correct itself by naming another.
    A challenge here would send the client to ask for a scope that would not help.

    # developer:secret, who is not an `admin` and so may not reach `pots.guarded.GET`
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.bans` database is empty
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: pots.guarded.GET

      {"jsonrpc": "2.0", "id": 31, "method": "tools/call",
       "params": {"name": "pots.guarded.GET", "arguments": {},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 31
      result:
        isError: true
      """
    And the reply does not contain:
      """
      insufficient_scope
      """

  Scenario: An argument the schemas would not take
    What the arguments are refused for is the model's to correct by sending others, so it
    is a result and not an error of the protocol.

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: pots._id.GET

      {"jsonrpc": "2.0", "id": 32, "method": "tools/call",
       "params": {"name": "pots._id.GET",
                  "arguments": {"id": "not-an-id"},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 32
      result:
        isError: true
      """

  Scenario: What the operation refused with
    A refusal is a value a model reads and may correct itself by, so it is a result rather
    than an error of the protocol.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            mcp:tool: Refuses, with what it was given.
            endpoint: error
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: echo.GET

      {"jsonrpc": "2.0", "id": 10, "method": "tools/call",
       "params": {"name": "echo.GET", "arguments": {},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 10
      result:
        content:
          - type: text
            text: message
        isError: true
        resultType: complete
      """

  Scenario: An operation that declares no output
    A schema the revision would have the reply validated against is worse said emptily than
    left unsaid — and the reply is answered all the same.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            mcp:tool: Answers with what it was given.
            endpoint: echo
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: echo.GET

      {"jsonrpc": "2.0", "id": 11, "method": "tools/call",
       "params": {"name": "echo.GET", "arguments": {"greeting": "hello"},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 11
      result:
        structuredContent:
          greeting: hello
        resultType: complete
      """

  Scenario: An origin that is not listed
    The revision requires this against DNS rebinding, and an empty list admits none.

    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      origin: https://elsewhere.example
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/list

      {"jsonrpc": "2.0", "id": 12, "method": "tools/list",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Without a credential
    A request without one is where the authorization flow starts, so the refusal carries
    the document that says where to get a token.

    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      oauth:
        authorize: https://app.nex.toa.io/oauth/authorize
        resources: ['/.mcp']
      mcp:
        name: Teapots
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/list

      {"jsonrpc": "2.0", "id": 13, "method": "tools/list",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      www-authenticate: Bearer resource_metadata="https://nex.toa.io/.well-known/oauth-protected-resource/.mcp"
      """
