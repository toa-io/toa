Feature: Context annexes samples

  Context extensions samples are declared as an array of annex call samples. A sample from that array is used
  once on each annex call, unless sample is declared as permanent. Permanent sample will be used constantly
  for all calls. See schema (src/.suite/sample.cos.yaml).

  Scenario: Configuration sample
    Given I have a sample for `signal` operation of `echo.beacon`:
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

  Configuration being well-known extension may be declared as a top-level property. Also,
  if configuration property is declared as an object, then it is considered to be a permanent sample.

    Given I have a sample for `signal` operation of `echo.beacon`:
      """yaml
      title: Should croak
      output: croak
      configuration:
        signal: croak
      """
    When I replay it
    Then it passes
