@security
Feature: Authorization server discovery

  What a client reads before it can authenticate. Both documents are public, are a
  function of the annotation alone, and are answered before anything is routed.

  Background:
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      oauth:
        authorize: https://app.nex.toa.io/oauth/authorize
        resources: ['/.mcp']
        scopes: [app:notes]
      mcp:
        name: Teapots
      """

  Scenario: The authorization server names its endpoints
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      issuer: https://nex.toa.io
      authorization_endpoint: https://app.nex.toa.io/oauth/authorize
      token_endpoint: https://nex.toa.io/identity/grants/
      response_types_supported:
        - code
      grant_types_supported:
        - authorization_code
      code_challenge_methods_supported:
        - S256
      token_endpoint_auth_methods_supported:
        - none
      client_id_metadata_document_supported: true
      authorization_response_iss_parameter_supported: true
      scopes_supported:
        - app:notes
      """

  Scenario: Registration is not advertised unless it is opened
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the reply does not contain:
      """
      registration_endpoint
      """

  Scenario: The protected resource is named by the path it is reached at
    When the following request is received:
      """
      GET /.well-known/oauth-protected-resource/.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      resource: https://nex.toa.io/.mcp
      authorization_servers:
        - https://nex.toa.io
      bearer_methods_supported:
        - header
      scopes_supported:
        - app:notes
      """

  Scenario: The origin has a document of its own
    When the following request is received:
      """
      GET /.well-known/oauth-protected-resource HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      resource: https://nex.toa.io
      authorization_servers:
        - https://nex.toa.io
      bearer_methods_supported:
        - header
      scopes_supported:
        - app:notes
      """

  Scenario: A client holding a stale token still reads discovery
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: nex.toa.io
      authorization: Bearer expired.and.useless
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      issuer: https://nex.toa.io
      """

  Scenario: The challenge names the resource the request was refused at
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      www-authenticate: Bearer resource_metadata="https://nex.toa.io/.well-known/oauth-protected-resource/.mcp", scope="app:notes"
      """

  Scenario: A host named after a property a plain object answers on its own
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: constructor
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: An authorization server nobody annotated is not discovered
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      /:
        io:output: true
        /hello/:
          anonymous: true
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
