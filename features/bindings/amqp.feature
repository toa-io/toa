Feature: AMQP binding

  Scenario: Send a request and receive a reply via AMQP
    Given I compose `echo.beacon` component
    When I call `echo.beacon.echo` with:
      """yaml
      input: ok
      """
    Then the reply is received:
      """yaml
      output: ok
      """
    And I disconnect

  Scenario: Start a component with external event source
    Given I have a component `external.consumer`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://localhost
        sources:
          external: amqp://localhost
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      TOA_AMQP_SOURCES_EXTERNAL_USERNAME=developer
      TOA_AMQP_SOURCES_EXTERNAL_PASSWORD=secret
      TOA_SQL_EXTERNAL_CONSUMER_USERNAME=developer
      TOA_SQL_EXTERNAL_CONSUMER_PASSWORD=secret
      """
    And I run `TOA_DEV=0 toa compose ./components/external.consumer --kill`
    Then program should exit with code 0
