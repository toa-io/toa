Feature: Realtime

  Realtime streams are served by the exposition gateway, and the events they carry are written by
  the components that route them. A deployment gives each component its routes and the Redis the
  streams are in, and runs no service of realtime's own.

  Scenario: Deployment with realtime manifest
    Given I have a component `realtime.streamer`
    And I have a context with:
      """
      stash: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: realtime-streamer
          variables:
            - name: TOA_REALTIME_REALTIME_STREAMER
              value: '[{"event":"created","properties":["streamer"]},{"event":"deleted","properties":["id","streamer"]}]'
            - name: TOA_STASH_REALTIME_STREAMS
              value: redis://redis.example.com
      """

  Scenario: Deployment with realtime annotation
    Given I have a component `realtime.streamer`
    And I have a context with:
      """
      stash: redis://redis.example.com
      realtime:
        realtime.streamer.created:
          key: id
          expose: [id]
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: realtime-streamer
          variables:
            - name: TOA_REALTIME_REALTIME_STREAMER
              value: '[{"event":"created","properties":["id"],"expose":["id"]},{"event":"deleted","properties":["id","streamer"]}]'
      """

  Scenario: Deployment of routes without a stash
    Given I have a component `realtime.streamer`
    And I have a context with:
      """
      stash: ~
      """
    Then exporting deployment fails with:
      """
      Component 'realtime.streamer' routes events to realtime streams, which are kept in the Redis the `stash` annotation names, and the context has none
      """

  Scenario: Deployment of a context route of a component not deployed
    Given I have a component `realtime.streamer`
    And I have a context with:
      """
      realtime:
        nowhere.else.created: id
      """
    Then exporting deployment fails with:
      """
      The realtime annotation routes events of 'nowhere.else', which is not deployed
      """

  Scenario: The gateway reads the streams
    Given I have a component `exposed.one`
    And I have a context with:
      """
      stash: redis://redis.example.com
      exposition:
        authorities:
          nex: nex.toa.io
        realtime:
          expire: 60
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: exposition-gateway
          variables:
            - name: TOA_REALTIME_EXPIRE
              value: '60'
            - name: TOA_STASH_REALTIME_STREAMS
              value: redis://redis.example.com
      """
