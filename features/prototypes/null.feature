Feature: Component with null prototype

  Scenario: Running a component with `null` prototype
    Given I boot `proto.null` component
    Then I disconnect

  Scenario: Implicit `null` prototype
    Given I compose `calculations` component
    When I call `default.calculations.observe`
    Then the following exception is thrown:
      """yaml
      message: "Endpoint 'observe' is not provided by 'default.calculations'"
      """
    And I disconnect
