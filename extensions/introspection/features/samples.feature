Feature: Payload samples

  Samples are real user data, so they are captured only when the context and the
  component both allow it. Either level can veto.

  Scenario: Nothing is captured by default
    When the `probe.target.compute` is called with:
      """yaml
      input:
        a: 4
        b: 5
      """
    Then the map contains an edge:
      """yaml
      dst:
        namespace: probe
        component: target
        operation: compute
      """
    And the map contains no edge:
      """yaml
      dst:
        namespace: probe
        component: target
        operation: compute
      sample:
        input:
          a: 4
      """

  @samples
  Scenario: The context enables capturing
    When the `probe.target.compute` is called with:
      """yaml
      input:
        a: 4
        b: 5
      """
    Then the map contains an edge:
      """yaml
      dst:
        namespace: probe
        component: target
        operation: compute
      sample:
        outcome: ok
        input:
          a: 4
          b: 5
      """

  @samples
  Scenario: A component vetoes capturing for itself
    When the `probe.discreet.ping` is called with:
      """yaml
      input:
        a: 7
      """
    Then the map contains an edge:
      """yaml
      dst:
        namespace: probe
        component: discreet
        operation: ping
      """
    And the map contains no edge:
      """yaml
      dst:
        namespace: probe
        component: discreet
        operation: ping
      sample:
        input:
          a: 7
      """
