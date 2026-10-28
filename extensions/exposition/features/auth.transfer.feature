Feature: Transferring a credential to the operation

  `auth:transfer` gives the `authorization` header to the operation, unread, as the property of
  its input the directive names, and grants access. The caller authenticates as itself, with a
  credential that is not the gateway's, and the operation verifies it.

  Scenario: The credential reaches the operation as it was sent
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          auth:transfer: authorization
          POST: echo
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIn0.c2lnbmF0dXJl
      accept: application/yaml
      content-type: application/yaml

      message: hello
      """
    Then the following reply is sent:
      """
      201 Created
      cache-control: no-store

      message: hello
      authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIn0.c2lnbmF0dXJl
      """

  Scenario: A scheme the gateway knows nothing of is transferred
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          auth:transfer: credential
          POST: echo
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      authorization: Signature keyId="hook",signature="c2lnbmF0dXJl"
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      credential: Signature keyId="hook",signature="c2lnbmF0dXJl"
      """

  Scenario: A request without the header is admitted
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          auth:transfer: authorization
          POST: echo
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      message: hello
      """
    Then the following reply is sent:
      """
      201 Created

      message: hello
      """
    And the reply does not contain:
      """
      authorization:
      """

  Scenario: A transferred credential is not a failed authentication
    Given the annotation:
      """yaml
      ip: x-real-ip
      bouncer:
        attempts: 1
        interval: 60
      """
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          auth:transfer: authorization
          POST: echo
      """
    # developer:wrong, which the gateway would refuse, and count
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      x-real-ip: 203.0.113.10
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      """
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      x-real-ip: 203.0.113.10
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created
      """

  Scenario: A procedure does not reach a method that transfers
    Given the annotation:
      """yaml
      rpc: {}
      """
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          auth:transfer: authorization
          POST: echo
      """
    When the following request is received:
      """
      POST /.rpc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "echo.POST", "params": {"message": "hello"}}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
