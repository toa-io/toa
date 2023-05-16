Feature: Context extensions (aspects) samples

  Context extensions samples are declared as an array of aspect call samples. A sample from that array is used
  once on each aspect call, unless sample is declared as permanent. Permanent sample will be used constantly
  for all calls. See schema (src/.suite/sample.cos.yaml).

  Scenario: Configuration sample
    Given I have a sample for `signal` operation of `echo`:
      """yaml
      title: Should woof
      extensions:
        configuration:
          - result:
              signal: woof
            permanent: true
      output: woof
      """
    When I replay it
    Then it passes

  Scenario: Configuration concise sample

  Configuration being well-known extension may be declared as a top-level property. Also,
  if configuration property is declared as an object, then it is considered to be a permanent sample.

    Given I have a sample for `signal` operation of `echo`:
      """yaml
      title: Should croak
      configuration:
        signal: croak
      output: croak
      """
    When I replay it
    Then it passes

  Scenario: False configuration sample fails
    Given I have a sample for `signal` operation of `echo`:
      """yaml
      title: Should woof
      configuration:
        signal: croak
      output: woof
      """
    When I replay it
    Then it fails

  Scenario: State sample
    Given I have a sample for `get` operation of `echo`:
      """yaml
      title: Should return state value
      state:
        value: foo
      output: foo
      """
    When I replay it
    Then it passes

  Scenario: State Map sample
    Given I have a sample for `resolve` operation of `echo`:
      """yaml
      title: Should return state value
      input: foo
      state:
        values:Map:
          foo: bar
      output: bar
      """
    When I replay it
    Then it passes

  Scenario: Origins request async sample
    Given I have a sample for `get` operation of `web`:
      """yaml
      title: Should return state value
      extensions:
        http:
          - arguments:
              - dev
              - path/to/resource
              - method: GET
            result:
              headers:
                get:sync: 'application/json'
              json:async:
                foo: bar
      output:
        foo: bar
      """
    When I replay it
    Then it passes
