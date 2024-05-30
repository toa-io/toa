Feature: Operation unmount

  Scenario: Unmount operation
    Given I compose `servers.one` component
    Then I disconnect
