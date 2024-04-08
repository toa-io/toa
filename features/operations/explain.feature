Feature: Operations explained

  Scenario: Explain operation
    Given I compose `echo.beacon` component
    Then the `echo.beacon.echo` explained is:
      """
      input:
        type: string
      output:
        type: string
      """
