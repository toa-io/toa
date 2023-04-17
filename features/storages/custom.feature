Feature: Custom storage

  Scenario: Starting a component with custom storage
    Given I boot `custom.storage` component
    Then I disconnect

  Scenario: Annotations for custom storage
    Given I have a component `custom.storage`
    And I have a context with:
      """yaml
      annotations:
        custom.storage: foo
      """
    When I run `toa env`
    Then I have an environment with:
      """
      TOA_TEST_CUSTOM_STORAGE=foo
      """
