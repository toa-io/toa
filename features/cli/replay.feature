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
      | echo.beacon       |
    And my working directory is ./components
    When I run `toa replay <argument>`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
      # Subtest: echo.beacon
      """
    Examples:
      | argument                          | type    |
      | ./math.calculations ./echo.beacon | list    |
      | *                                 | pattern |

  Scenario: Replay sample sets of all components within a context
    Given I have components:
      | math.calculations |
      | echo.beacon       |
    And I have a context
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
      # Subtest: echo.beacon
      """

  Scenario: Replay samples from the context directory
    Given I have components:
      | math.calculations |
      | echo.beacon       |
    And I have a context
    When I run `toa replay`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: Operations
      # Subtest: math.calculations
      # Subtest: echo.beacon
      """

  Scenario: Replay integration samples
    Given I have components:
      | math.calculations |
      | echo.beacon       |
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

  Scenario Outline: Replay component sample by title
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
      | neg\w+ numbers              |

  Scenario Outline: Replay integration sample by title <selector>
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
      | negative \w+ /integration                |

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

  Scenario: Replay samples for a specific component
    Given I have components:
      | math.calculations |
      | tea.pots          |
    And I have a context
    When I run `toa replay --component tea.pots`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      # Subtest: tea.pots
      """
    And stdout should not contain lines:
      """
      # Subtest: math.calculations
      """

  Scenario: Replay autonomous samples without environment
    Given I have a component `math.calculations`
    When I run `TOA_DEV=0 toa replay ./components/math.calculations`
    Then program should exit with code 0

  Scenario: Replay autonomous sample without environment for a component with storage defined
    Given I have a component `tea.pots`
    When I run `TOA_DEV=0 toa replay ./components/tea.pots`
    Then program should exit with code 0

  Scenario: Replay autonomous sample without environment for a component with AMQP Origin
    Given I have a component `origins.amqp`
    When I run `TOA_DEV=0 toa replay ./components/origins.amqp`
    Then program should exit with code 0

  Scenario: Replay samples in Docker
    Given I have components:
      | math.calculations |
      | echo.beacon       |
    And my working directory is ./components
    When I run `toa replay * --dock`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
      # Subtest: echo.beacon
      """

  Scenario: Replay samples with options in Docker
    Given I have components:
      | math.calculations |
      | echo.beacon       |
    And my working directory is ./components
    When I run `toa replay * --component math.calculations --dock`
    Then program should exit with code 0
    Then stdout should contain lines:
      """
      # Subtest: math.calculations
      """
    And stdout should not contain lines:
      """
      # Subtest: echo.beacon
      """
