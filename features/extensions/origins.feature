Feature: Origins Extension

  Scenario: HTTP Aspect
    Given I boot `origins.http` component
    When I invoke `test`
    Then the reply is received:
      """yaml
      output:
        http:
          method: GET
          protocol: http
          originalUrl: /some/path
      """
    And I disconnect

  Scenario: AMQP Aspect
    Given I boot `origins.amqp_local` component
    Then I invoke `test`
    And I disconnect

  Scenario: Local environment with annotations
    Given I have a component `origins.http`
    And I have a context with:
      """
      origins:
        origins.http:
          bad: http://localhost:8888/
      """
    When I run `toa env`
    And I run `toa invoke bad -p ./components/origins.http`
    Then program should exit with code 0

  Scenario: Deployment annotations
    Given I have a component `origins.http`
    And I have a context with:
      """yaml
      origins:
        origins.http:
          bad: http://localhost:8888/
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        origins-http:
          - name: TOA_ORIGINS_ORIGINS_HTTP
            value: eyJiYWQiOiJodHRwOi8vbG9jYWxob3N0Ojg4ODgvIn0=
      """

  Scenario: AMQP credentials
    Given I have a component `origins.amqp`
    And I have a context with:
      """yaml
      origins:
        origins.amqp:
          bad: amqp://localhost
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_ORIGINS_ORIGINS_AMQP_QUEUE_USERNAME=developer
      TOA_ORIGINS_ORIGINS_AMQP_QUEUE_PASSWORD=secret
      TOA_ORIGINS_ORIGINS_AMQP_BAD_USERNAME=developer
      TOA_ORIGINS_ORIGINS_AMQP_BAD_PASSWORD=secret
      """
    And I run `toa invoke test -p ./components/origins.amqp`
    Then program should exit with code 0
