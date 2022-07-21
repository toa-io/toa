Feature: External event receiver

  Scenario: Consume external events to SQL
    Given I have a PostgreSQL database developer
    And the database has a structure for the external.consumer component
    When I compose external.consumer component
    And I publish to an event.external.something.happened exchange a message:
      """
      time: 1658142544
      description: 'something happened'
      """
    And I wait 0.1 seconds
    Then the table of external.consumer must contain rows:
      | time       | description        |
      | 1658142544 | something happened |
    And I disconnect
