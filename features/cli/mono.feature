Feature: toa mono

  Run composition and extension services in one process

  Scenario: Show `toa mono` help
    When I run `toa mono --help`
    Then program should exit
    And stdout should contain lines:
      """
      toa mono [path]
      Run composition and services
      """

  Scenario: Shutdown after it's started
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa mono --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Composition complete
      Composition shutdown complete
      """

  Scenario: Run composition and exposition
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      configuration:
        identity.tokens:
          keys:
            - id: key0
              key: $IDENTITY_TOKENS_ENCRYPTION_KEY0
      """
    When I run `toa env --dev`
    And I run `toa mono --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Composition complete
      Gateway started
      Composition shutdown complete
      """
