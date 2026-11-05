@security
Feature: An application issues OpenID tokens

  A component asks for a token naming a subject and an audience, and another application that
  trusts the issuer admits it as `Bearer`. Here the gateway is both: it issues as `nex`, and
  trusts itself.

  Background:
    Given the `identity.federation` database is empty
    And the issuer https://nex.toa.io is the Gateway
    And the configuration secrets:
      """yaml
      ISSUER_K1: |
        -----BEGIN PRIVATE KEY-----
        MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgxm3BWG5aAV7OrSv3
        TtAp1lLpFyEtbGIW+pQXhSdjchqhRANCAARI1gY46XmhY6ThpWt0+QR8W5/+n4Sz
        CTKvRi0ClfEbSqEFfbDwLGxCpmjFSbRwHRnEt/dl/AFk+qh6o+kbNao9
        -----END PRIVATE KEY-----
      ISSUER_K2: |
        -----BEGIN PRIVATE KEY-----
        MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgrFxkm5ePZQecNWct
        WsPm95n1lPvHkIG5H1UHSothwqOhRANCAARJkbVfVM75CblR6VSDkjHGh8uAAvPG
        9ANv72EPUmRmXTDkOx02ZdeQayRlOYxDlAn3bBb/tiWKMKHFas7AsQGN
        -----END PRIVATE KEY-----
      # K1 as a secret store may keep a PEM: on one line, its breaks turned into spaces
      ISSUER_K1_LINE: -----BEGIN PRIVATE KEY----- MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgxm3BWG5aAV7OrSv3 TtAp1lLpFyEtbGIW+pQXhSdjchqhRANCAARI1gY46XmhY6ThpWt0+QR8W5/+n4Sz CTKvRi0ClfEbSqEFfbDwLGxCpmjFSbRwHRnEt/dl/AFk+qh6o+kbNao9 -----END PRIVATE KEY-----
      """

  Scenario: The issuer is discovered
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      issuer: true
      """
    When the following request is received:
      """
      GET /.well-known/openid-configuration HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      cache-control: public, max-age=3600

      issuer: https://nex.toa.io
      jwks_uri: https://nex.toa.io/identity/federation/keys/
      response_types_supported:
        - id_token
      subject_types_supported:
        - public
      id_token_signing_alg_values_supported:
        - ES256
      """

  Scenario: An issuer is not an authorization server
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      issuer: true
      /:
        /invoices:
          GET:
            auth:claims:
              iss: https://nex.toa.io
            dev:stub: ok
      """
    When the following request is received:
      """
      GET /.well-known/oauth-authorization-server HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      GET /invoices/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    And the reply does not contain:
      """
      www-authenticate
      """

  Scenario: No document without the annotation
    When the following request is received:
      """
      GET /.well-known/openid-configuration HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Every key is published, and none of its private part
    Given the `identity.federation` configuration:
      """yaml
      keys:
        - kid: k2
          key: $ISSUER_K2
        - kid: k1
          key: $ISSUER_K1
      """
    When the following request is received:
      """
      GET /identity/federation/keys/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      keys:
        - kty: EC
          crv: P-256
          x: SZG1X1TO-Qm5UelUg5IxxofLgALzxvQDb-9hD1JkZl0
          'y': MOQ7HTZl15BrJGU5jEOUCfdsFv-2JYowocVqzsCxAY0
          kid: k2
          alg: ES256
          use: sig
        - kty: EC
          crv: P-256
          x: SNYGOOl5oWOk4aVrdPkEfFuf_p-Eswkyr0YtApXxG0o
          'y': oQV9sPAsbEKmaMVJtHAdGcS392X8AWT6qHqj6Rs1qj0
          kid: k1
          alg: ES256
          use: sig
      """
    When the following request is received:
      """
      GET /identity/federation/keys/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    Then the reply does not contain:
      """
      "d":
      """

  Scenario: A key kept on one line is published, and admits what it signs
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      issuer: true
      /:
        /invoices:
          GET:
            auth:claims:
              iss: https://nex.toa.io
              sub: billing
            dev:stub: ok
      """
    And the `identity.federation` configuration:
      """yaml
      keys:
        - kid: k1
          key: $ISSUER_K1_LINE
      trust:
        - iss: https://nex.toa.io
          aud: https://another.toa.io
      """
    And the `workload` is running
    When the following request is received:
      """
      GET /identity/federation/keys/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      keys:
        - kty: EC
          crv: P-256
          x: SNYGOOl5oWOk4aVrdPkEfFuf_p-Eswkyr0YtApXxG0o
          'y': oQV9sPAsbEKmaMVJtHAdGcS392X8AWT6qHqj6Rs1qj0
          kid: k1
          alg: ES256
          use: sig
      """
    When the following request is received:
      """
      POST /workload/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      authority: nex
      sub: billing
      audience: https://another.toa.io
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      GET /invoices/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: A token is admitted by an application that trusts its issuer
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      issuer: true
      /:
        /invoices:
          GET:
            auth:claims:
              iss: https://nex.toa.io
              sub: billing
            dev:stub: ok
      """
    And the `identity.federation` configuration:
      """yaml
      keys:
        - kid: k1
          key: $ISSUER_K1
      trust:
        - iss: https://nex.toa.io
          aud: https://another.toa.io
      """
    And the `workload` is running
    When the following request is received:
      """
      POST /workload/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      authority: nex
      sub: billing
      audience: https://another.toa.io
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      GET /invoices/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: An application grants a role to a user of another one
    Given the `identity.roles` database is empty
    And the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      issuer: true
      """
    # the application called makes the caller its principal: the role is its own to grant
    And the `identity.federation` configuration:
      """yaml
      keys:
        - kid: k1
          key: $ISSUER_K1
      trust:
        - iss: https://nex.toa.io
          aud: https://another.toa.io
      principal:
        authority: nex
        iss: https://nex.toa.io
        sub: control
      """
    And the `workload` is running
    And transient identity Bob
    When the following request is received:
      """
      POST /workload/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      authority: nex
      sub: control
      audience: https://another.toa.io
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      POST /identity/roles/${{ Bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ token }}
      accept: application/yaml
      content-type: application/yaml

      role: editor
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      GET /identity/roles/${{ Bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ Bob.token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      - editor
      """

  Scenario: A token for another audience is refused
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      issuer: true
      /:
        /invoices:
          GET:
            auth:claims:
              iss: https://nex.toa.io
            dev:stub: ok
      """
    And the `identity.federation` configuration:
      """yaml
      keys:
        - kid: k1
          key: $ISSUER_K1
      trust:
        - iss: https://nex.toa.io
          aud: https://another.toa.io
      """
    And the `workload` is running
    When the following request is received:
      """
      POST /workload/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      authority: nex
      sub: billing
      audience: https://third.toa.io
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
    When the following request is received:
      """
      GET /invoices/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Nothing is issued without keys
    Given the annotation:
      """yaml
      authorities:
        nex: nex.toa.io
      issuer: true
      """
    And the `workload` is running
    When the following request is received:
      """
      POST /workload/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      authority: nex
      sub: billing
      audience: https://another.toa.io
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: NOT_ISSUER
      """

  Scenario: Nothing is issued for an authority the annotation does not map
    Given the `identity.federation` configuration:
      """yaml
      keys:
        - kid: k1
          key: $ISSUER_K1
      """
    And the `workload` is running
    When the following request is received:
      """
      POST /workload/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      authority: somewhere
      sub: billing
      audience: https://another.toa.io
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: NOT_ISSUER
      """

  Scenario: Nothing is issued for longer than the limit
    Given the `identity.federation` configuration:
      """yaml
      keys:
        - kid: k1
          key: $ISSUER_K1
      lifetime: 600
      """
    And the `workload` is running
    When the following request is received:
      """
      POST /workload/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      authority: nex
      sub: billing
      audience: https://another.toa.io
      lifetime: 601
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: LIFETIME
      """
