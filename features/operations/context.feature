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

  Scenario: region
    Given an environment variable `TOA_REGION` is set to "1"
    And I compose `context.one` component
    When I call `context.one.region`
    Then the reply is received:
      """yaml
      region: 1
      """

  Scenario: no region
    # what a deployment that is one place reads, and what its records carry
    Given I compose `context.one` component
    When I call `context.one.region`
    Then the reply is received:
      """yaml
      region: 0
      """
