Feature: Replay samples

  Scenario: Replay component samples under component root
    Given I have a component `math.calculations`
    And my working directory is ./components/math.calculations
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
        # Subtest: Operations
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
    Given I have a PostgreSQL database developer
    And I have a component `external.consumer`
    When I run `toa replay ./components/external.consumer`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: Should pass payload to input
      """

  Scenario: Replay samples from the context directory
    Given I have components:
      | math.calculations |
      | node.syntaxes     |
      | external.consumer |
    And I have a context
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: Operations
      # Subtest: math.calculations
      # Subtest: node.syntaxes
      # Subtest: something_happened
      """

  Scenario: Replay integration samples
    Given I have components:
      | math.calculations |
      | node.syntaxes     |
      | external.consumer |
    And I have a context
    And I have integration samples
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: Component samples
      # Subtest: Integration samples
      # Subtest: Should add numbers /integration
      # Subtest: Should add negative numbers /integration
      """

  Scenario: Replay specified operation samples
    Given I have a component `math.calculations`
    And my working directory is ./components/math.calculations
    When I run `toa replay --operation sum`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      # Subtest: sum
      """
    And stdout should not contain lines:
      """
      # Subtest: multi
      """

  Scenario: Replay integration samples for specified operation
    Given I have a component `math.calculations`
    And I have a context
    And I have integration samples
    When I run `toa replay --operation multi`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      # Subtest: multi
      """
    And stdout should not contain lines:
      """
      # Subtest: sum
      """

  Scenario Outline: Replay specific component sample
    Given I have a component `math.calculations`
    And my working directory is ./components/math.calculations
    When I run `toa replay --title "<selector>"`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      # Subtest: Should add negative numbers
      """
    And stdout should not contain lines:
      """
      # Subtest: Should add numbers
      """
    Examples:
      | selector                    |
      | Should add negative numbers |
      | negative                    |

  Scenario Outline: Replay specific integration sample
    Given I have a component `math.calculations`
    And I have a context
    And I have integration samples
    When I run `toa replay --title "<selector>"`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      # Subtest: Should add negative numbers /integration
      """
    And stdout should not contain lines:
      """
      # Subtest: Should add numbers /integration
      """
    Examples:
      | selector                                 |
      | Should add negative numbers /integration |
      | negative .* /integration                 |

  Scenario: Replay integration tests only
    Given I have a component `math.calculations`
    And I have a context
    And I have integration samples
    When I run `toa replay --integration`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      # Subtest: Integration samples
      """
    And stdout should not contain lines:
      """
      # Subtest: Component samples
      """

  Scenario: Replay specific component samples
    Given I have components:
      | math.calculations |
      | external.consumer |
    And I have a context
    When I run `toa replay --component external.consumer`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      # Subtest: something_happened
      """
    And stdout should not contain lines:
      """
      # Subtest: math.calculations
      """
