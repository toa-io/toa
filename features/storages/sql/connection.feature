Feature: SQL Storage Connection

  Scenario: Connect to Postgres

    Component boot should not throw exceptions

    When I boot component sql.postgres
    Then I disconnect
