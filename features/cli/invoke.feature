Feature: Invoke operation

  Scenario: Invoke operation
    Given I have a component `echo.beacon`
    And my working directory is ./components/echo.beacon
    When I run `toa invoke echo "{ input: 'foo' }"`
    Then stderr should be empty
    And stdout should contain lines:
    """
    foo
    """
