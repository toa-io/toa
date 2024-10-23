Feature: Unmanaged operation

  Scenario: Unmanaged insert
    Given I compose `unmanaged` component
    Then I call `unmanaged.insert`
