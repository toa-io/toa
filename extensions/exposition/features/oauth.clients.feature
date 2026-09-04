@security
Feature: Client registration

  A client that speaks nothing else registers what it is and is given an identifier for it.
  The identifier is a hash of the metadata, so a client that cannot remember it registered
  here does not leave another row every time it connects.

  Background:
    Given the `identity.clients` database is empty
    And the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      oauth:
        authorize: https://app.nex.toa.io/oauth/authorize
        registration: open
      """

  Scenario: A client registers what it is
    When the following request is received:
      """
      POST /identity/clients/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      client_name: Claude
      redirect_uris:
        - https://claude.ai/api/mcp/auth_callback
      token_endpoint_auth_method: none
      """
    Then the following reply is sent:
      """
      201 Created

      client_id: ${{ client }}
      client_name: Claude
      redirect_uris:
        - https://claude.ai/api/mcp/auth_callback
      grant_types:
        - authorization_code
      response_types:
        - code
      token_endpoint_auth_method: none
      """

  Scenario: The same client is the same client
    When the following request is received:
      """
      POST /identity/clients/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      client_name: Claude
      redirect_uris:
        - https://claude.ai/api/mcp/auth_callback
        - http://localhost/callback
      """
    Then the following reply is sent:
      """
      201 Created

      client_id: ${{ first }}
      """
    # the same metadata, written in another order
    When the following request is received:
      """
      POST /identity/clients/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      client_name: Claude
      redirect_uris:
        - http://localhost/callback
        - https://claude.ai/api/mcp/auth_callback
      """
    Then the following reply is sent:
      """
      201 Created

      client_id: ${{ first }}
      """

  Scenario: A redirect a code must not be sent to
    When the following request is received:
      """
      POST /identity/clients/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      client_name: Insecure
      redirect_uris:
        - http://example.com/callback
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_redirect_uri
      """

  Scenario: A client that would authenticate at the token endpoint
    When the following request is received:
      """
      POST /identity/clients/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      client_name: Confidential
      redirect_uris:
        - https://claude.ai/api/mcp/auth_callback
      token_endpoint_auth_method: client_secret_post
      """
    Then the following reply is sent:
      """
      400 Bad Request

      error: invalid_client_metadata
      """

  Scenario: Registration is advertised once it is opened
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      registration_endpoint: https://nex.toa.io/identity/clients/
      """

  Scenario: The consent page reads who is asking
    When the following request is received:
      """
      POST /identity/clients/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      accept: application/yaml

      client_name: Claude
      client_uri: https://claude.ai
      redirect_uris:
        - https://claude.ai/api/mcp/auth_callback
      """
    Then the following reply is sent:
      """
      201 Created

      client_id: ${{ client }}
      """
    # the page is authenticated by the time it asks, so this is not anonymous
    When the following request is received:
      """
      GET /identity/clients/${{ client }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      client_id: ${{ client }}
      client_name: Claude
      client_uri: https://claude.ai
      redirect_uris:
        - https://claude.ai/api/mcp/auth_callback
      """

  Scenario: A client nobody registered
    When the following request is received:
      """
      GET /identity/clients/00000000000000000000000000000000/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: UNKNOWN_CLIENT
      """
