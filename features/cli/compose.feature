Feature: toa compose

  Run composition

  Scenario: Show help
    When I run `toa compose --help`
    Then program should exit
    And stdout should contain lines:
    """
    toa compose [paths...]
    Run composition
    Examples:
      toa compose ./component
      toa compose ./first ./second
      toa compose ./components/**/
      toa compose ./a/**/ ./b/**/
    """

  Scenario Outline: Run compositions
    Given my working directory is <working directory>
    When I run <command>
    And I wait <delay> second
    Then abort
    Then stderr should be empty
    And stdout should contain lines:
    """
    info Composition complete
    """

    Examples:
      | command                                            | working directory           | delay |
      | `toa compose`                                      | ./integration/dummies/nulls | 1     |
      | `toa compose ./dummies/nulls`                      | ./integration               | 1     |
      | `toa compose ./dummies/nulls ./dummies/configured` | ./integration               | 1     |
      | `toa compose ./context/*/**`                       | ./integration               | 2     |
