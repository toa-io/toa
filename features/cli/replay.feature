Feature: Replay samples

  Scenario: Replay component samples under component root
    Given I have a component math.calculations
    And my working directory is ./components/math.calculations
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: Replay
        # Subtest: Should add numbers
        # Subtest: Should add negative numbers
      """

  Scenario Outline: Replay component samples using `--path`
    Given I have a component math.calculations
    And my working directory is ./
    When I run `toa replay <argument> ./components/math.calculations`
    Then program should exit with code 0
    Examples:
      | argument |
      | --path   |
      | -p       |
