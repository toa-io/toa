Feature: Event edges

  A published event is an edge of its own, so an event nobody listens to is still
  visible. Delivery to a receiver is attributed to the producing event.

  Scenario: Publishing an event
    When the `probe.source.transit` is called with:
      """yaml
      query:
        id: c0ffee00c0ffee00c0ffee00c0ffee00
      input:
        value: 1
      """
    Then the map contains an edge:
      """yaml
      kind: publish
      src:
        namespace: probe
        component: source
      dst:
        namespace: probe
        component: source
        event: created
      """

  Scenario: Receiving an event
    When the `probe.source.transit` is called with:
      """yaml
      query:
        id: c0ffee00c0ffee00c0ffee00c0ffee01
      input:
        value: 2
      """
    Then the map contains an edge:
      """yaml
      kind: event
      src:
        namespace: probe
        component: source
        event: created
      dst:
        namespace: probe
        component: target
        operation: count
      """
