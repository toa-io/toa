Feature: Events (pub/sub)

  Scenario: Send and receive an event
    Given I consume events from `numbers_added` exchange as `checker`
    When I emit an event to the `numbers_added` exchange
    Then `checker` has received the event

  Scenario: Receive an event by two consumer groups
    Given I consume events from `numbers_added` exchange as `first`
    And I consume events from `numbers_added` exchange as `second`
    When I emit an event to the `numbers_added` exchange
    Then `first` has received the event
    And `second` has received the event
