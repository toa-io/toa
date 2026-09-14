@cli
Feature: toa map

  Which version of a component a process asks what that component provides.

  Scenario: Show `toa map` help
    When I run `toa map --help`
    And stdout should contain lines:
      """
      toa map [environment]
      Export component versions to a components.json file
      """

  Scenario: Writing the map of a Context
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the file ./components.json contains line starting with '  "dummies.one":'
    And the file ./components.json contains line starting with '  "dummies.two":'

  Scenario: An evicted component is in it
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      evicted:
        components:
          - dummies.two
      """
    When I run `toa map`
    Then program should exit with code 0
    And the file ./components.json contains line starting with '  "dummies.two":'

  Scenario: A composition is refused where a Context has no map
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa compose ./components/* --kill`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Run `toa map` to write one, or name one with `--map`.
      """

  Scenario: A component outside a Context needs none
    Given I have a component `dummies.one`
    When I run `toa compose ./components/* --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Composition shutdown complete
      """
