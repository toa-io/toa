@shutdown
Feature: Graceful shutdown

  A component reports on a timer, so whatever it observed since the last report
  would be lost on a deploy. Stopping flushes it instead: the collector drains
  its buffer while its remotes are still connected.

  This suite runs with a flush period long enough that the timer cannot fire,
  so nothing here reaches the map unless the shutdown does it.

  Scenario: Observations are flushed on shutdown
    When the `probe.source.relay` is called with:
      """yaml
      input:
        a: 2
        b: 3
      """
    And the components are stopped
    Then the map contains an edge:
      """yaml
      kind: call
      src:
        namespace: probe
        component: source
        operation: relay
      dst:
        namespace: probe
        component: target
        operation: compute
      """

  Scenario: Component descriptions are flushed on shutdown
    When the components are stopped
    Then the map contains a node:
      """yaml
      namespace: probe
      component: target
      """
