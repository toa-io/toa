Feature: Queues Storage

  Scenario: Connecting to the broker
    When I boot `queues.one` component
    Then I disconnect
