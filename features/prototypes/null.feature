Feature: Component with null prototype

  Scenario: Running a component with `null` prototype
    Given I boot `proto.null` component
    Then I disconnect
