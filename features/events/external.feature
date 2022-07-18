Feature: External event receiver

  Scenario: Consume external events to SQL
    Given I have a PostgreSQL database developer
    And the database has a structure for the external.consumer component
    When I boot external.consumer component
    And I publish to event.external.something.happened queue a message:
      """
      time: 16581425448
      description: 'something happened'
      """
    And I wait 0.1 seconds
    Then the table must contain rows:
      | time        | description        |
      | 16581425448 | something happened |
