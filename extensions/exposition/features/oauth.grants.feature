@security
Feature: Authorization code flow

  A client is refused, finds the authorization server, registers, is consented to by a user,
  and exchanges the code it was given for a token it can come back with. The consent page is
  the application's own — the two calls in the background are what it would make.

  Background:
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
      /:
        io:output: true
        /pots:
          anyone: true
          GET:
            dev:stub: Kettles and teapots.
            mcp:tool: What there is to brew in.
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
      """
    Then the following reply is sent:
      """
      201 Created
      cache-control: no-store

      code: ${{ code }}
      expires_in: 60
      """

  Scenario: A client comes back with the token it was given
    # nothing yet, and the client is told where to get one
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      www-authenticate: Bearer resource_metadata="https://nex.toa.io/.well-known/oauth-protected-resource/.mcp"
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
      cache-control: no-store

      access_token: ${{ access_token }}
      token_type: Bearer
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ access_token }}
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
          - name: pots/GET
            description: What there is to brew in.
      """

  Scenario: A code is spent once
    When the following request is received:
      """
      POST /identity/grants/ HTTP/1.1
      host: nex.toa.io
      content-type: application/x-www-form-urlencoded
      accept: application/yaml

      grant_type=authorization_code&code=${{ code }}&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      POST /identity/grants/ HTTP/1.1
      host: nex.toa.io
      content-type: application/x-www-form-urlencoded
      accept: application/yaml

      grant_type=authorization_code&code=${{ code }}&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_grant
      """

  Scenario: A verifier that did not make that challenge
    When the following request is received:
      """
      POST /identity/grants/ HTTP/1.1
      host: nex.toa.io
      content-type: application/x-www-form-urlencoded
      accept: application/yaml

      grant_type=authorization_code&code=${{ code }}&code_verifier=this-is-not-the-verifier-that-made-that-challenge
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_grant
      """
    # the code was spent trying, so guessing at it buys nothing
    When the following request is received:
      """
      POST /identity/grants/ HTTP/1.1
      host: nex.toa.io
      content-type: application/x-www-form-urlencoded
      accept: application/yaml

      grant_type=authorization_code&code=${{ code }}&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_grant
      """

  Scenario: A redirect swapped between authorizing and exchanging
    When the following request is received:
      """
      POST /identity/grants/ HTTP/1.1
      host: nex.toa.io
      content-type: application/x-www-form-urlencoded
      accept: application/yaml

      grant_type=authorization_code&code=${{ code }}&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&redirect_uri=https%3A%2F%2Fevil.example%2Fcallback
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_grant
      """

  Scenario: A grant nobody may be sent a code for
    When the following request is received:
      """
      POST /identity/grants/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml
      accept: application/yaml

      client: ${{ client }}
      redirect: https://evil.example/callback
      challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
      method: S256
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_request
      """

  Scenario: A challenge method that proves nothing
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
      method: plain
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_request
      """

  Scenario: A grant only its own identity may see
    When the following request is received:
      """
      GET /identity/grants/00000000000000000000000000000000/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Taking back what was allowed
    When the following request is received:
      """
      POST /identity/grants/ HTTP/1.1
      host: nex.toa.io
      content-type: application/x-www-form-urlencoded
      accept: application/yaml

      grant_type=authorization_code&code=${{ code }}&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
      """
    Then the following reply is sent:
      """
      200 OK

      access_token: ${{ access_token }}
      """
    When the following request is received:
      """
      GET /identity/grants/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      - id: ${{ grant }}
        client: ${{ client }}
      """
    When the following request is received:
      """
      DELETE /identity/grants/efe3a65ebbee47ed95a73edd911ea328/${{ grant }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      204 No Content
      """
