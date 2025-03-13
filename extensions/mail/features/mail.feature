Feature: Sending an email

  Scenario: Sending text email
    Given the `mail.agent` configuration:
      """yaml
      provider: Console
      domains: [nobody.null]
      """
    And the service is running
    And the spam is running
    When `spam.send` is called:
      """yaml
      from: alice@nobody.null
      to: no@one
      subject: Test
      text: hello!
      """
    And `spam.send` is called:
      """yaml
      from: bob@nobody.null
      to: no@one
      subject: Test
      text: hello!
      """
    And `spam.send` is called:
      """yaml
      from: charlie@somebody.null
      to: no@one
      subject: Test
      text: This won't work, domain is not allowed
      """
    Then go check the email or logs

#  Scenario: Sending text email via Resend
#    Given the `mail.agent` configuration:
#      """yaml
#      provider: Resend
#      domains: [resend.dev]
#      options:
#        key: << PUT KEY HERE >>
#      """
#    And the service is running
#    And the spam is running
#    When `spam.send` is called:
#      """yaml
#      from: onboarding@resend.dev
#      to: tema.gurtovoy@gmail.com
#      subject: Sent via Resend
#      text: Ok.
#      """
