@cli
Feature: Call operation

  Scenario: Call operation
    Given I compose `echo.beacon` component
    And I have a component map of:
      | echo.beacon |
    When I run `toa call echo.beacon.echo "{ input: 'foo' }"`
    Then stderr should be empty
    And stdout should contain lines:
    """
    foo
    """

  Scenario: Call generator
    Given I compose `streams.numbers` component
    And I have a component map of:
      | streams.numbers |
    When I run `toa call streams.numbers.generate "{ input: { limit: 3 } }"`
    Then stderr should be empty
    And stdout should contain lines:
    """
    0
    1
    2
    """
