Feature: The broker of the log away

  Background:
    Given the chronicles are empty

  Scenario: The relay takes a batch while the broker of the log is away, and nothing is lost
    Given the broker of the chronicles is away
    And the chronicles relay is running
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        sent: 1761200002000
        events:
          - id: a1
            name: page_viewed
            time: 1761200000000
      """
    Then the reply is received:
      """yaml
      status: 202
      accepted: 1
      """
    And I wait 3 seconds
    And the chronicles answer "SELECT count() AS n FROM encounters":
      """yaml
      - n: 0
      """
    When the chronicles relay stops
    And the broker of the chronicles is back
    And the chronicles relay is running
    Then the chronicles answer "SELECT id FROM encounters FINAL" within 30 seconds:
      """yaml
      - id: a1
      """

