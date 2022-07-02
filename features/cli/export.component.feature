Feature: Print manifest

  Scenario: Show help
    Given I have a component dummies.one
    And my working directory is ./dummies.one
    When I run `toa export manifest --help`
    Then program should exit
    And stdout should contain lines:
      """
      toa export manifest
      Print manifest
      """

  Scenario Outline: Print manifest from component directory
    Given I have a component dummies.one
    And my working directory is ./dummies.one
    When I run `toa export <artifact>`
    Then program should exit
    And stdout should contain lines:
      """
      name: one
      namespace: dummies
      """
    Examples:
      | artifact |
      | manifest |
      | man      |


  Scenario: Print manifest located by path
    Given I have a component dummies.two
    And my working directory is ./
    When I run `toa export manifest -p ./dummies.two`
    Then program should exit
    And stdout should contain lines:
      """
      name: two
      namespace: dummies
      """
