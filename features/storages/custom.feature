Feature: Custom storage

  Scenario: Starting a component with custom storage
    Given I boot `custom.storage` component
    Then I disconnect
