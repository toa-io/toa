Feature: SQL Storage Operations

  Background:
    Given I have a PostgreSQL database developer

  Scenario: Create a new record in the PostgreSQL database

    Given the database has a structure for the `sql.one` component
    When I boot `sql.one` component
    And I invoke `transit` with:
      """
      input:
        bar: test
      """
    Then the table of `sql.one` must contain rows:
      | foo | bar  | _version |
      | 0   | test | 1        |
    And I disconnect

  Scenario Outline: Composition with shared connection

  This reproduces an awful problem with mixed up tables for shared connections. Connections
  are shared among components within composition.

    Given the database has a structure for the `sql.one` component
    And the database has a structure for the `sql.two` component
    When I compose components:
      | sql.one |
      | sql.two |
    And I call `<callee>.transit` with:
      """
      input:
        bar: test
      """
    Then the table of `<callee>` must contain rows:
      | foo | bar  | _version |
      | 0   | test | 1        |
    And I disconnect

    Examples:
      | callee  |
      | sql.one |
      | sql.two |

  Scenario: Create a record with environment
    Given I have a component `sql.one`
    And I have a context with:
      """yaml
      sql: pg://localhost/developer
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      TOA_SQL_SQL_ONE_USERNAME=developer
      TOA_SQL_SQL_ONE_PASSWORD=secret
      """
    And I run `TOA_DEV=0 toa invoke transit "{ input: { bar: 'test' } }" -p ./components/sql.one`
    Then program should exit with code 0
