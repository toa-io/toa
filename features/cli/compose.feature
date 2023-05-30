Feature: toa compose

  Run composition

  Scenario: Show help
    When I run `toa compose --help`
    And stdout should contain lines:
      """
      toa compose [paths...]
      Run composition
        toa compose ./component
        toa compose ./first ./second
        toa compose ./components/**/
        toa compose ./a/**/ ./b/**/
      """

  Scenario Outline: Run compositions
    Given I have components:
      | dummies.one |
      | dummies.two |
    And my working directory is <working directory>
    When I run <command>
    And I wait <delay> seconds
    And I abort execution
    Then stderr should be empty
    And stdout should contain lines:
      """
      info Composition complete
      """
    Examples:
      | command                                | working directory        | delay |
      | `toa compose`                          | ./components/dummies.one | 0     |
      | `toa compose ./components/dummies.two` | ./                       | 0     |
      | `toa compose dummies.one dummies.two`  | ./components             | 0     |
      | `toa compose ./**/*`                   | ./                       | 1     |

  Scenario: Shutdown composition after it's started
    Given I have a component `dummies.one`
    When I run `toa compose ./components/* --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      info Composition complete
      info Composition shutdown complete
      """
