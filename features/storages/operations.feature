Feature: SQL Storage Operations

  Background:
    Given I have a PostgreSQL database developer

  Scenario: Create a new record in the PostgreSQL database

    Given the database has a structure for the sql.one component
    When I boot sql.one component
    And I invoke transit with:
      """
      input:
        bar: test
      """
    Then the table of sql.one must contain rows:
      | foo | bar  | _version |
      | 0   | test | 1        |
    And I disconnect

  Scenario Outline: Composition with shared connection

    Given the database has a structure for the sql.one component
    And the database has a structure for the sql.two component
    When I compose components:
      | sql.one |
      | sql.two |
    And I call <callee>.transit with:
      """
      input:
        bar: test
      """
    Then the table of <callee> must contain rows:
      | foo | bar  | _version |
      | 0   | test | 1        |
    And I disconnect

    Examples:
      | callee  |
      | sql.one |
      | sql.two |

