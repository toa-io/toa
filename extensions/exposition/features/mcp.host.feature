@security
Feature: MCP on a host of its own

  An application names a host per authority, and MCP is served at the root of it. The host is
  a host of that authority: the credentials are the same ones, and the identity is the same
  identity. Nothing else is served there — the address a model is given means one thing.

  Background:
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      oauth:
        authorize: https://app.nex.toa.io/oauth/authorize
      mcp:
        name: Teapots
        anonymous: true
        hosts:
          nex: mcp.toa.io
      /:
        io:output: true
        /pots:
          anonymous: true
          GET:
            mcp:tool: true
            help:method:
              description: Every pot there is.
            dev:stub: Kettles and teapots.
      """

  Scenario: The endpoint is the root of its host
    When the following request is received:
      """
      POST / HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 1
      result:
        tools:
          - name: pots.GET
      """

  Scenario: A tool is called there
    When the following request is received:
      """
      POST / HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "pots.GET", "arguments": {}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 2
      result:
        structuredContent: Kettles and teapots.
      """

  Scenario: The path keeps answering on the authority's own host
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 3, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      - name: pots.GET
      """

  Scenario: Nothing else answers on the MCP host
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 4, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      GET /.discovery/ HTTP/1.1
      host: mcp.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: The root of the MCP host is answered by the endpoint alone
    When the following request is received:
      """
      GET / HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      405 Method Not Allowed
      allow: POST
      """

  Scenario: A host nothing names is served the application
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: other.example.com
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      Kettles and teapots.
      """
    When the following request is received:
      """
      POST / HTTP/1.1
      host: other.example.com
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 5, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      405 Method Not Allowed
      """

  Scenario: The protected resource is the origin of the MCP host
    When the following request is received:
      """
      GET /.well-known/oauth-protected-resource HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      resource: https://mcp.toa.io
      authorization_servers:
        - https://nex.toa.io
      bearer_methods_supported:
        - header
      """

  Scenario: The MCP host names no authorization server of its own
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      GET /.well-known/openid-configuration HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: A request without a credential is told where the document is
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      oauth:
        authorize: https://app.nex.toa.io/oauth/authorize
        scopes: [app:pots]
      mcp:
        name: Teapots
        hosts:
          nex: mcp.toa.io
      """
    When the following request is received:
      """
      POST / HTTP/1.1
      host: mcp.toa.io
      accept: text/plain
      content-type: application/json

      {"jsonrpc": "2.0", "id": 6, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      www-authenticate: Bearer resource_metadata="https://mcp.toa.io/.well-known/oauth-protected-resource", scope="app:pots"
      """

  Scenario: An identity is one identity on the MCP host
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      mcp:
        name: Teapots
        hosts:
          nex: mcp.toa.io
      /:
        /pots:
          anyone: true
          GET:
            mcp:tool: true
            help:method:
              description: Every pot there is.
            dev:stub: Kettles and teapots.
      """
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      username: #{{ id | set nex.username }}
      password: '#{{ password 8 | set nex.password }}'
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      authorization: Basic #{{ basic nex }}
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ nex.token }}
      """
    When the following request is received:
      """
      POST / HTTP/1.1
      host: mcp.toa.io
      accept: application/yaml
      content-type: application/json
      authorization: Token ${{ nex.token }}

      {"jsonrpc": "2.0", "id": 7, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      - name: pots.GET
      """

  Scenario: A token is bound to the host it was asked for
    Given the `identity.clients` database is empty
    And the `identity.grants` database is empty
    And the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      oauth:
        authorize: https://app.nex.toa.io/oauth/authorize
        resources: ['/.mcp']
        registration: open
      mcp:
        name: Teapots
        hosts:
          nex: mcp.toa.io
      /:
        io:output: true
        /pots:
          anyone: true
          GET:
            mcp:tool: true
            help:method:
              description: Every pot there is.
            dev:stub: Kettles and teapots.
      """
    When the following request is received:
      """
      POST /identity/clients/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      client_name: Claude
      redirect_uris:
        - https://claude.ai/api/mcp/auth_callback
      """
    Then the following reply is sent:
      """
      201 Created

      client_id: ${{ client }}
      """
    When the following request is received:
      """
      POST /identity/grants/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml
      accept: application/yaml

      client: ${{ client }}
      redirect: https://claude.ai/api/mcp/auth_callback
      challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
      method: S256
      resource:
        - https://mcp.toa.io
      """
    Then the following reply is sent:
      """
      201 Created

      code: ${{ code }}
      """
    When the following request is received:
      """
      POST /identity/grants/ HTTP/1.1
      host: nex.toa.io
      content-type: application/x-www-form-urlencoded
      accept: application/yaml

      grant_type=authorization_code&code=${{ code }}&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&redirect_uri=https%3A%2F%2Fclaude.ai%2Fapi%2Fmcp%2Fauth_callback&client_id=${{ client }}
      """
    Then the following reply is sent:
      """
      200 OK

      access_token: ${{ access_token }}
      """
    When the following request is received:
      """
      POST / HTTP/1.1
      host: mcp.toa.io
      authorization: Bearer ${{ access_token }}
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 8, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      200 OK

      - name: pots.GET
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ access_token }}
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 9, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      www-authenticate: Bearer resource_metadata="https://nex.toa.io/.well-known/oauth-protected-resource/.mcp"
      """
