Feature: Origins Extension

  Scenario: Using `http` protocol
    Given I boot `origins.http` component
    When I invoke `test`
    Then the reply is received:
      """yaml
      output:
        http:
          method: GET
          protocol: http
          originalUrl: /some/path
      """
    And I disconnect

  Scenario: Deployment annotations
    Given I have a component `origins.http`
    And I have a context with:
      """yaml
      origins:
        origins.http:
          bad: http://localhost:8888/
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        origins-http:
          - name: TOA_ORIGINS_ORIGINS_HTTP
            value: eyJiYWQiOiJodHRwOi8vbG9jYWxob3N0Ojg4ODgvIn0=
      """
