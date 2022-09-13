Feature: Context annexes samples

  Scenario: Configuration sample
    Given I have a sample of `signal` for `echo.beacon`:
      """yaml
      title: Should woof
      output: woof
      extensions:
        configuration:
          - result:
              signal: woof
            permanent: true
      """
    When I replay it
    Then it passes

  Scenario: Configuration concise sample
    Given I have a sample of `signal` for `echo.beacon`:
      """yaml
      title: Should croak
      output: croak
      configuration:
        signal: croak
      """
    When I replay it
    Then it passes
