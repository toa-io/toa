Feature: Pulse

  A component calls its own operation on the cadence its manifest states. Nothing is stored:
  the interval is a function of the clock, and the replica that owns it is the one that calls.

  # The fixture splits a four second cycle into four, so it is called once a second and told
  # which second of the cycle it is running for. Six seconds of it, and three calls asked for:
  # the first interval is gone before atomicity has settled, and a loaded run may lose another.
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
