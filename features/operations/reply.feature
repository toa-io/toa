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
    Given I compose `reply.contract` component
    When I call `reply.contract.unfit`
    Then the reply is received:
      """yaml
      {}
      """

  Scenario: An output of the wrong type is left as it is where the environment is not local
    Given I compose `reply.contract` component
    When I call `reply.contract.coerced`
    Then the reply is received:
      """yaml
      value: 1
      """

  Scenario: An undeclared error passes where the environment is not local
    Given I compose `reply.contract` component
    When I call `reply.contract.undeclared`
    Then the error is received:
      """yaml
      code: OTHER
      """

  Scenario: An error where none are declared passes where the environment is not local
    Given I compose `reply.contract` component
    When I call `reply.contract.silent`
    Then the error is received:
      """yaml
      code: SILENT
      """
