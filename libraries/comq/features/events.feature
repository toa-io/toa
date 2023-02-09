Feature: Events (pub/sub)

  Scenario: Send and receive event
    Given I consume events from `numbers_added` exchange as `checker`
    When I emit following event to the `numbers_added` exchange:
    """yaml
    a: 1
    b: 2
    """
    Then `checker` has received the event

  Scenario: Receive event by two consumer groups
    Given I consume events from `numbers_added` exchange as `first`
    And I consume events from `numbers_added` exchange as `second`
    When I emit following event to the `numbers_added` exchange:
    """yaml
    a: 1
    b: 2
    """
    Then `first` has received the event
    And `second` has received the event
