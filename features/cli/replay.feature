Feature: Replay samples

  Scenario: Replay component samples under component root
    Given I have a component math.calculations
    And my working directory is ./components/math.calculations
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
        # Subtest: Replay
          # Subtest: Should add numbers
          # Subtest: Should add negative numbers
      """

  Scenario: Replay component samples using implicit path
    Given I have a component math.calculations
    And my working directory is ./
    When I run `toa replay ./components/math.calculations`
    Then program should exit with code 0

  Scenario Outline: Replay multiple component sample sets
    Given I have components:
      | math.calculations |
      | node.syntaxes     |
    And my working directory is ./components
    When I run `toa replay <argument>`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
      # Subtest: node.syntaxes
      """
    Examples:
      | argument                                                  |
      | ./components/math.calculations ./components/node.syntaxes |
      | ./components/*                                            |
