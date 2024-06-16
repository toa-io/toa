@security
Feature: Federated identity authentication

  Background:
    Given the `identity.federation` database is empty
    And local IDP is running
    And the IDP token for Bob is issued
    And the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """

  Scenario: Full claim
    Given the annotation:
      """yaml
      /:
        GET:
          auth:claim:
            iss: http://localhost:44444
            aud: test
            sub: Bob
          dev:stub: ok
      """

    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Only `sub`
    Given the annotation:
      """yaml
      /:
        GET:
          auth:claim:
            sub: Bob
          dev:stub: ok
      """

    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: No `sub`
    Given the annotation:
      """yaml
      /:
        GET:
          auth:claim:
            iss: http://localhost:44444
            aud: test
          dev:stub: ok
      """

    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: `sub` mismatch
    Given the annotation:
      """yaml
      /:
        GET:
          auth:claim:
            iss: http://localhost:44444
            sub: Alice
          dev:stub: ok
      """

    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: `aud` mismatch
    Given the annotation:
      """yaml
      /:
        GET:
          auth:claim:
            iss: http://localhost:44444
            aud: goalkeepers
          dev:stub: ok
      """

    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Matching authority and Route parameter
    Given the annotation:
      """yaml
      authorities:
        test: the.test.local
      /:
        /:id:
          GET:
            auth:claim:
              aud: :authority
              sub: /:id
            dev:stub: ok
      """

    When the following request is received:
      """
      GET /Bob/ HTTP/1.1
      host: the.test.local
      authorization: Bearer ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: `iss` matching authority common domain
    Given the annotation:
      """yaml
      /:
        /:id:
          GET:
            auth:claim:
              iss: :domain
              sub: /:id
            dev:stub: ok
      """

    When the following request is received:
      """
      GET /Bob/ HTTP/1.1
      host: localhost
      authorization: Bearer ${{ Bob.id_token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """
