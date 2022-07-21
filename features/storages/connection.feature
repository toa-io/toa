Feature: SQL Storage Connection

  Background:
    Given I have a PostgreSQL database developer

  Scenario: Connect to PostgreSQL without exceptions
    When I boot sql.one component
    Then I disconnect

  Scenario: Shared connection
    When I compose components:
      | sql.one |
      | sql.two |
    And I disconnect
    Then stdout should contain line once:
      """
      info SQL storage connected to pg://developer@localhost
      """
