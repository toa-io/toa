Feature: Reply contract

  A reply is validated against what its operation declares, on a local environment.

  Scenario: An output that fits the schema
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.fit`
    Then the reply is received:
      """yaml
      value: ok
      """

  Scenario: An output that does not fit the schema
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.unfit`
    Then the following exception is thrown:
      """yaml
      code: 211
      """

  Scenario: An output of the wrong type is refused, not coerced
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.coerced`
    Then the following exception is thrown:
      """yaml
      code: 211
      """

  Scenario: An error the operation declares
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.declared`
    Then the error is received:
      """yaml
      code: KNOWN
      """

  Scenario: An error the operation does not declare
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.undeclared`
    Then the following exception is thrown:
      """yaml
      code: 211
      """

  Scenario: An error where the operation declares none
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.silent`
    Then the following exception is thrown:
      """yaml
      code: 211
      """

  Scenario: A reply is taken as given where the environment is not local
    Given an environment variable `TOA_ENV` is set to "production"
    And I compose `reply.contract` component
    When I call `reply.contract.unfit`
    Then the reply is received:
      """yaml
      {}
      """

  Scenario: An output of the wrong type is left as it is where the environment is not local
    Given an environment variable `TOA_ENV` is set to "production"
    And I compose `reply.contract` component
    When I call `reply.contract.coerced`
    Then the reply is received:
      """yaml
      value: 1
      """

  Scenario: An undeclared error passes where the environment is not local
    Given an environment variable `TOA_ENV` is set to "production"
    And I compose `reply.contract` component
    When I call `reply.contract.undeclared`
    Then the error is received:
      """yaml
      code: OTHER
      """

  Scenario: An error where none are declared passes where the environment is not local
    Given an environment variable `TOA_ENV` is set to "production"
    And I compose `reply.contract` component
    When I call `reply.contract.silent`
    Then the error is received:
      """yaml
      code: SILENT
      """

  Scenario: An error is received with its code, its message and its cause
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.caused`
    Then the error is received:
      """yaml
      code: KNOWN
      message: KNOWN
      cause:
        until: '2026-01-01'
      """

  Scenario: An error passed on arrives as it was
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.passed`
    Then the error is received:
      """yaml
      code: KNOWN
      message: KNOWN
      cause:
        until: '2026-01-01'
      """

  Scenario: Nothing but the cause travels with an error
    Given an environment variable `TOA_ENV` is set to "local"
    And I compose `reply.contract` component
    When I call `reply.contract.extra`
    Then the error carries nothing but:
      """yaml
      code: KNOWN
      """

  Scenario Outline: An error with no message is an exception on a <environment> environment
    Given an environment variable `TOA_ENV` is set to "<environment>"
    And I compose `reply.contract` component
    When I call `reply.contract.<operation>`
    Then the following exception is thrown:
      """yaml
      code: 211
      """

    Examples:
      | environment | operation |
      | local       | blank     |
      | production  | blank     |
      | production  | fielded   |
