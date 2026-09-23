Feature: Pulse

  A component calls its own operation on the cadence its manifest states. Nothing is stored:
  the interval is a function of the clock, and the replica that owns it is the one that calls.

  # The fixture splits a four second cycle into four, so it is called once a second and told
  # which second of the cycle it is running for. Six seconds of it, and three calls asked for:
  # the first interval is gone before atomicity has settled, and a loaded run may lose another.
  @timing
  Scenario: Calling on a cadence
    Given I compose `pulse` component
    And I wait 6 seconds
    When I call `default.pulse.calls` with:
      """yaml
      input:
        least: 3
      """
    Then the reply is received:
      """yaml
      n: 4
      enough: true
      consecutive: true
      """

  # The fixture declares both kinds against one clock: `tick` is the component's and `sweep` is
  # every replica's. With nothing to agree through, no replica owns an interval of `tick` and
  # nobody calls it, while `sweep` — which asks nobody — is called every two seconds.
  @timing
  Scenario: Calling in every replica where nothing coordinates
    Given an environment variable `TOA_ATOMICITY_REDIS` is set to ""
    And I compose `pulse` component
    And I wait 6 seconds
    When I call `default.pulse.sweeps` with:
      """yaml
      input:
        least: 2
      """
    Then the reply is received:
      """yaml
      enough: true
      """
    When I call `default.pulse.calls` with:
      """yaml
      input:
        least: 1
      """
    Then the reply is received:
      """yaml
      calls: 0
      """

  # Two replicas of one component are two processes, so one of them is run as one. Each records
  # the calls it made where the other cannot: its own process id, in a file they share.
  @cli @timing
  Scenario: Calling in every replica
    Given my working directory is .
    And I have a component `pulse`
    And I have a context with:
      """yaml
      mongodb: mongodb://localhost:31020
      amqp:
        context: amqp://localhost:31010
      """
    And an environment variable `SWEEPS` is set to "sweeps"
    When I run `toa env`
    And I run `toa map`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    And I run `TOA_DEV=0 toa compose ./components/pulse`
    And I compose `pulse` component
    And I wait 6 seconds
    And I abort execution
    Then the file ./sweeps contains 2 distinct lines
