Feature: OTP authentication

  OTP credentials format is base64(username:password)

  Background:
    Given the `identity.otp` configuration:
      """yaml
      lifetime: 1
      """
    And the Gateway is running

  Scenario: Authenticate using OTP
    Given OTP for `alice` in `nex` authority is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ alice.otp }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}

      id: ${{ id }}
      """

    # valid only once
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ alice.otp }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

    # same username is resolved to the same identity
    Given OTP for `alice` in `nex` authority is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ alice.otp }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ id }}
      """

    # expiration
    Given OTP for `alice` in `nex` authority is issued
    # half a second past the lifetime, rather than exactly it: the margin was the round trip
    And after 1.5 seconds
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ alice.otp }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Generate own OTP
    Given transient identity bob
    When the following request is received:
      """
      POST /identity/otp/${{ bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ bob.token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      code: '${{ bob.code }}'
      """

    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP #{{ otp bob }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ bob.id }}
      """

  Scenario: Guessing OTP codes
    Given the `identity.otp` configuration:
      """yaml
      lifetime: 60
      attempts: 2
      """
    And the Gateway is running
    And OTP for `alice` in `nex` authority is issued
    # alice:wrong
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP YWxpY2U6d3Jvbmc=
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP YWxpY2U6d3Jvbmc=
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    # the attempts are spent, the code itself is refused
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ alice.otp }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: A username authenticated from several devices at once is one identity
    Given the `identity.otp` configuration:
      """yaml
      lifetime: 60
      attempts: 10
      """
    And the Gateway is running
    And the `identity.otp` database is empty
    And 8 OTPs for `dave` in `nex` authority are issued
    When the OTPs of `dave` are presented at once
    Then each resolves to the same identity

  Scenario: A username is tied to an identity once its code is confirmed
    Given the `identity.otp` configuration:
      """yaml
      lifetime: 60
      """
    And the Gateway is running
    And the `identity.otp` database is empty
    And transient identity bob
    And transient identity mallory
    And OTP for `carol` in `nex` authority is issued for bob
    # the code is not a sign-in: whoever enters it would be signed in as bob
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ carol.otp }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      PUT /identity/otp/${{ bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ mallory.token }}
      content-type: application/yaml

      username: carol
      code: '${{ carol.code }}'
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    # the code was issued for bob
    When the following request is received:
      """
      PUT /identity/otp/${{ mallory.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ mallory.token }}
      content-type: application/yaml
      accept: application/yaml

      username: carol
      code: '${{ carol.code }}'
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: EXPIRED
      """
    When the following request is received:
      """
      PUT /identity/otp/${{ bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ bob.token }}
      content-type: application/yaml

      username: carol
      code: '${{ carol.code }}'
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    # spent
    When the following request is received:
      """
      PUT /identity/otp/${{ bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ bob.token }}
      content-type: application/yaml
      accept: application/yaml

      username: carol
      code: '${{ carol.code }}'
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: EXPIRED
      """
    Given OTP for `carol` in `nex` authority is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ carol.otp }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ bob.id }}
      """

  Scenario: A username tied to one identity is not tied to another
    Given the `identity.otp` configuration:
      """yaml
      lifetime: 60
      """
    And the Gateway is running
    And the `identity.otp` database is empty
    And transient identity mallory
    And OTP for `dan` in `nex` authority is issued for mallory
    # issuing it tied nothing, so the first sign-in of the username makes an identity of its own
    And OTP for `dan` in `nex` authority is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ dan.otp }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ dan.id }}
      """
    When the following request is received:
      """
      PUT /identity/otp/${{ mallory.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ mallory.token }}
      content-type: application/yaml
      accept: application/yaml

      username: dan
      code: '${{ dan.code }}'
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: EXISTS
      """
    Given OTP for `dan` in `nex` authority is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: OTP ${{ dan.otp }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ dan.id }}
      """

  Scenario: Guessing the code of a username to tie
    Given the `identity.otp` configuration:
      """yaml
      lifetime: 60
      attempts: 1
      """
    And the Gateway is running
    And transient identity bob
    And OTP for `erin` in `nex` authority is issued for bob
    When the following request is received:
      """
      PUT /identity/otp/${{ bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ bob.token }}
      content-type: application/yaml
      accept: application/yaml

      username: erin
      code: 'wrong'
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity
      """
    # the attempts are spent, the code itself is refused
    When the following request is received:
      """
      PUT /identity/otp/${{ bob.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ bob.token }}
      content-type: application/yaml
      accept: application/yaml

      username: erin
      code: '${{ erin.code }}'
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: TOO_MANY_ATTEMPTS
      """
