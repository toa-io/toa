@security
Feature: Chronicles through the gateway

  The log is read through `chronicles.queries`, whose routes are tools where the context publishes
  MCP. Reading takes `system:chronicles:query`, and views take `system:chronicles:views`;
  `system:chronicles` grants both. What browsers send arrives at `chronicles.ingestion`, which
  anyone may reach.

  Background:
    # admin:secret, analyst:pass, guest:secret
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | admin    | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | analyst  | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
      | 9a0c4d6a1e2b4f7c8d3e5f6a7b8c9d0e | nex       | guest    | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                    |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:chronicles       |
      | 30c969e05ff6437097ed5f07fc52358e | 4344518184ad44228baffce7a44fd0b1 | system:chronicles:query |
    And the annotation:
      """yaml
      mcp:
        name: Shop
      """
    And the chronicles are empty
    And the chronicles service is running

  Scenario: A query takes the role
    When the following request is received:
      """
      POST /chronicles/queries/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic Z3Vlc3Q6c2VjcmV0
      accept: application/yaml
      content-type: application/yaml

      sql: SELECT 1 AS one
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      """
      POST /chronicles/queries/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic YW5hbHlzdDpwYXNz
      accept: application/yaml
      content-type: application/yaml

      sql: SELECT 1 AS one
      """
    Then the following reply is sent:
      """
      201 Created

      columns:
        - name: one
      rows:
        - - 1
      truncated: false
      """

  Scenario: A view takes its own role
    When the following request is received:
      """
      PUT /chronicles/queries/views/ones/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic YW5hbHlzdDpwYXNz
      content-type: application/yaml

      sql: SELECT 1 AS one
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      """
      PUT /chronicles/queries/views/ones/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic YWRtaW46c2VjcmV0
      content-type: application/yaml

      sql: SELECT 1 AS one
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    When the following request is received:
      """
      POST /chronicles/queries/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic YW5hbHlzdDpwYXNz
      accept: application/yaml
      content-type: application/yaml

      sql: SELECT one FROM ones
      """
    Then the following reply is sent:
      """
      201 Created

      rows:
        - - 1
      """

  Scenario: The tools are what the caller may call
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      authorization: Basic YW5hbHlzdDpwYXNz
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/list

      {"jsonrpc": "2.0", "id": 1, "method": "tools/list",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      result:
        tools:
          - name: chronicles.queries.GET
            title: What the log holds
          - name: chronicles.queries.POST
            title: Query the log
      """
    And the reply does not contain:
      """
      chronicles.queries.views._name.PUT
      """

  Scenario: A query over MCP
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      authorization: Basic YWRtaW46c2VjcmV0
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/call
      mcp-name: chronicles.queries.POST

      {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
       "params": {"name": "chronicles.queries.POST", "arguments": {"sql": "INSERT INTO events (id) VALUES ('x')"},
                  "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      result:
        isError: true
      """

  Scenario: What a browser sends
    When the following request is received:
      """
      POST /chronicles/ingestion/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      [{"id": "g1", "name": "page.viewed", "time": 1761200000000, "payload": {"path": "/"}}]
      """
    Then the following reply is sent:
      """
      202 Accepted

      accepted: 1
      """
    When the following request is received:
      """
      POST /chronicles/ingestion/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: text/plain

      [{"id": "g2", "name": "page.left", "time": 1761200000000}]
      """
    Then the following reply is sent:
      """
      202 Accepted

      accepted: 1
      """
