Feature: Replay samples

  Scenario: Replay component samples under component root
    Given I have a component `math.calculations`
    And my working directory is ./components/math.calculations
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
        # Subtest: Replay
          # Subtest: multi
            # Subtest: Should add numbers
          # Subtest: sum
            # Subtest: Should add numbers
            # Subtest: Should add negative numbers
      """

  Scenario: Replay component samples using implicit path
    Given I have a component `math.calculations`
    And my working directory is ./
    When I run `toa replay ./components/math.calculations`
    Then program should exit with code 0

  Scenario Outline: Replay multiple component sample sets found with <type>
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
      | argument                            | type    |
      | ./math.calculations ./node.syntaxes | list    |
      | *                                   | pattern |

  Scenario: Replay sample sets of all components within a context
    Given I have components:
      | math.calculations |
      | node.syntaxes     |
    And I have a context
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
      # Subtest: node.syntaxes
      """

  Scenario: Replay message sample
    Given I have a component `external.consumer`
    When I run `toa replay ./components/external.consumer`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: Should pass payload to input
      """
