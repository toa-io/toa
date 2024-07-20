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
            value: W3siZXZlbnQiOiJtb25nby5vbmUuY3JlYXRlZCIsInByb3BlcnRpZXMiOlsiaWQiXX1d
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
            value: W3siZXZlbnQiOiJyZWFsdGltZS5zdHJlYW1lci5jcmVhdGVkIiwicHJvcGVydGllcyI6WyJzdHJlYW1lciJdfSx7ImV2ZW50IjoicmVhbHRpbWUuc3RyZWFtZXIuZGVsZXRlZCIsInByb3BlcnRpZXMiOlsiaWQiLCJzdHJlYW1lciJdfV0=
          components:
            - realtime-streams
      """
