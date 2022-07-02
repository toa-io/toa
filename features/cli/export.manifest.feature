Feature: Print manifest

  Scenario: Show help
    When I run `toa export manifest --help`
    Then program should exit
    And stdout should contain lines:
      """
      toa export manifest
      Print manifest
        -e, --error
        -p, --path
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

  Scenario Outline: Validate valid manifest
    Given I have a component dummies.two
    # which has valid manifest
    And my working directory is ./dummies.two
    When I run `toa export manifest <flag>`
    Then program should exit
    And stdout should be empty
    Examples:
      | flag    |
      | --error |
      | -e      |

  Scenario: Validate invalid manifest
    Given I have a component dummies.invalid
    # which has invalid manifest
    And my working directory is ./dummies.invalid
    When I run `toa export manifest -e`
    Then program should exit
    And stderr should contain lines:
      """
      error Locator name and namespace must be defined
      """
    And stderr should contain 1 line
