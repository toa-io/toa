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
          - name: TOA_ORIGINS_ORIGINS_HTTP_BAD_USERNAME
            secret:
              name: toa-origins-origins-http-bad
              key: username
          - name: TOA_ORIGINS_ORIGINS_HTTP_BAD_PASSWORD
            secret:
              name: toa-origins-origins-http-bad
              key: password
      """

  Scenario: Local environment
    Given I have a component `origins.http`
    And I have a context with:
      """
      origins:
        origins.http:
          bad: http://localhost:8888/
      """
    When I run `toa env`
    Then I run `toa invoke bad -p ./components/origins.http`
    Then program should exit with code 0
