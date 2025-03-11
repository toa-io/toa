Feature: Sending an email

  Scenario: Sending HTML email
    Given the `mail.agent` configuration:
      """yaml
      templates: http://localhost:8088/emails/
      provider: Console
      from: noreply@nobody.null
      """
    And the service is running
    And the spam is running
    And rendering is sending:
      """html
      <head>
        <title>Hello!</title>
      </head>
      <body>
        <p>This is a beautiful email</p>
      </body>
      """
    When `spam.send` is called:
      """yaml
      to: no@one
      template: hello
      """
    When `spam.send` is called:
      """yaml
      to: some@one
      template: bye
      data:
        name: Some One
      """
    Then go check the email or logs

  Scenario: Sending text email
    Given the `mail.agent` configuration:
      """yaml
      provider: Console
      from: noreply@nobody.null
      """
    And the service is running
    And the spam is running
    When `spam.send` is called:
      """yaml
      to: no@one
      subject: Test
      text: hello!
      """
    Then go check the email or logs
