Feature: Realtime

  Realtime streams are served by the exposition gateway, and the events they carry are written by
  the components that route them. The `realtime` annotation says where the streams are kept, and a
  deployment gives it to every process; nothing is deployed for realtime of its own.

  Scenario: Deployment of a component that routes events
    Given I have a component `realtime.streamer`
    And I have a context with:
      """
      realtime:
        streams: redis://realtime.example.com
        expire: 60
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: realtime-streamer
          variables:
            - name: TOA_REALTIME_STREAMS
              value: redis://realtime.example.com
            - name: TOA_REALTIME_EXPIRE
              value: '60'
      services:
        - name: exposition-gateway
          variables:
            - name: TOA_REALTIME_STREAMS
              value: redis://realtime.example.com
            - name: TOA_REALTIME_EXPIRE
              value: '60'
      """

  Scenario: Deployment of streams kept in several Redis
    Given I have a component `realtime.streamer`
    And I have a context with:
      """
      realtime:
        streams:
          - redis://one.example.com
          - redis://two.example.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: realtime-streamer
          variables:
            - name: TOA_REALTIME_STREAMS
              value: redis://one.example.com redis://two.example.com
      """

  Scenario: Deployment of routes without the realtime annotation
    Given I have a component `realtime.streamer`
    And I have a context
    Then exporting deployment fails with:
      """
      Invalid realtime annotation: must be object
      """

  Scenario: Deployment of routes declared in the context
    Given I have a component `realtime.streamer`
    And I have a context with:
      """
      realtime:
        streams: redis://realtime.example.com
        realtime.streamer.created: id
      """
    Then exporting deployment fails with:
      """
      Invalid realtime annotation: must NOT have additional properties
      """
