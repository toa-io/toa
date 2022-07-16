Feature: SQL Storage Connection

  Background:
    Given I have a PostgreSQL database developer

  Scenario: Connect to PostgreSQL without exceptions
    When I boot sql.postgres component
    Then I disconnect
