Feature: Realtime extension

  Scenario: Deployment with realtime annotation
    Given I have a context with:
      """yaml
      realtime:
        mongo.one.created: id
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: realtime-streams
          variables:
          - name: TOA_REALTIME
            value: '[{"event":"mongo.one.created","properties":["id"]}]'
          components:
            - realtime-streams
      """

  Scenario: Deployment with realtime manifest
    Given I have a component `realtime.streamer`
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: realtime-streams
          variables:
          - name: TOA_REALTIME
            value: '[{"event":"realtime.streamer.created","properties":["streamer"]},{"event":"realtime.streamer.deleted","properties":["id","streamer"]}]'
          - name: TOA_STASH_REALTIME_STREAMS
            value: redis://localhost:31040
          components:
            - realtime-streams
      """
