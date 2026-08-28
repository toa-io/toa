Feature: Call edges

  An edge is recorded by the component being called. The caller only declares who
  it is, on the request, so a caller that runs no collector of its own — a service,
  the CLI — still appears on the map. A local call and a remote one are the same.

  The origin is what tells a direct call apart from the delivery of an event. Which
  events exist and who receives them is declared, so it is a node's business; an
  edge is what actually happened.

  Scenario: A remote call
    When the `probe.source.relay` is called with:
      """yaml
      input:
        a: 2
        b: 3
      """
    Then the map contains an edge:
      """yaml
      src:
        namespace: probe
        component: source
        operation: relay
      dst:
        namespace: probe
        component: target
        operation: compute
      """

  Scenario: A call caused by an event
    When the `probe.source.transit` is called with:
      """yaml
      query:
        id: c0ffee00c0ffee00c0ffee00c0ffee00
      input:
        value: 1
      """
    Then the map contains an edge:
      """yaml
      src:
        namespace: probe
        component: source
        event: created
      dst:
        namespace: probe
        component: target
        operation: count
      """

  Scenario: A call from a service
    When the `probe.target.compute` is called with:
      """yaml
      input:
        a: 1
        b: 1
      source:
        service: cli
      """
    Then the map contains an edge:
      """yaml
      src:
        service: cli
      dst:
        namespace: probe
        component: target
        operation: compute
      """

  Scenario: A call from an unidentified caller
    When the `probe.target.compute` is called with:
      """yaml
      input:
        a: 1
        b: 1
      """
    Then the map contains an edge:
      """yaml
      src:
        service: unknown
      dst:
        namespace: probe
        component: target
        operation: compute
      """

  Scenario: An operation returning an error is still an edge
    When the `probe.source.fail` is called with:
      """yaml
      input: null
      """
    Then the map contains an edge:
      """yaml
      dst:
        namespace: probe
        component: source
        operation: fail
      """

  Scenario: An operation throwing is still an edge
    When the `probe.source.crash` is called with:
      """yaml
      input: null
      """
    Then the map contains an edge:
      """yaml
      dst:
        namespace: probe
        component: source
        operation: crash
      """

  Scenario: An opted out component produces no edges
    When the `probe.quiet.ping` is called with:
      """yaml
      input:
        a: 1
      """
    Then the map contains no edge:
      """yaml
      dst:
        namespace: probe
        component: quiet
      """
