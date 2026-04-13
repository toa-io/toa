Feature: Context

  Scenario: env
    Given an environment variable `TOA_ENV` is set to "local"
    And an environment variable `TOA_CONTEXT` is set to "toa-dev"
    And I compose `context.one` component
    When I call `context.one.env`
    Then the reply is received:
      """yaml
      env: local
      context: toa-dev
      """
