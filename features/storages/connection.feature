Feature: SQL Storage Connection

  Background:
    Given I have a PostgreSQL database developer

  Scenario: Connect to PostgreSQL without exceptions
    When I boot `sql.one` component
    Then I disconnect

  Scenario: Shared connection compose
    Given I have components:
      | sql.one |
      | sql.two |
    When I run `toa compose components/*`
    And I abort execution
    Then stdout should contain line once:
      """
      info SQL storage connected to pg://developer@localhost
      """
