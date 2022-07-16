Feature: SQL Storage Connection

  Background:
    Given I have a PostgreSQL database developer

  Scenario: Connect to PostgreSQL without exceptions
    Given the database has a structure for the sql.postgres component
    When I boot sql.postgres component
    Then I disconnect
