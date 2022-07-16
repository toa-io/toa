Feature: SQL Storage Operations

  Background:
    Given I have a PostgreSQL database developer

  Scenario: Create a new record in the PostgreSQL database
    Given the database has a structure for the sql.postgres component
    When I boot sql.postgres component
    # remove after next steps implementation
    And I disconnect
    And invoke command transit with:
      """
      input:
        bar: test
      """
    Then the table must contain rows:
      | foo | bar  | _version |
      | 0   | test | 1        |
    And I disconnect
