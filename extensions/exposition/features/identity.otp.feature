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
    And after 1 second
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
