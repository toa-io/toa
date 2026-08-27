Feature: Component descriptions

  The static half of the map: what each component is, taken from its manifest
  when the composition starts.

  Scenario: Describing operations
    Then the map contains a node:
      """yaml
      namespace: probe
      component: target
      operations:
        - endpoint: compute
          type: computation
          scope: none
          input:
            type: object
            properties:
              a: { type: number }
              b: { type: number }
          output:
            type: number
      """

  Scenario: Describing the entity
    Then the map contains a node:
      """yaml
      namespace: probe
      component: target
      entity:
        storage: "@toa.io/storages.null"
        schema:
          properties:
            counted:
              type: integer
      """

  Scenario: Describing events
    Then the map contains a node:
      """yaml
      namespace: probe
      component: source
      events:
        - label: created
        - label: updated
        - label: deleted
        - label: sync
      """

  Scenario: Describing receivers
    Then the map contains a node:
      """yaml
      namespace: probe
      component: target
      receivers:
        - label: probe.source.created
          source: probe.source
          operation: count
          conditioned: false
          adaptive: false
      """

  Scenario: An opted out component is not described
    Then the map contains no node:
      """yaml
      namespace: probe
      component: quiet
      """
