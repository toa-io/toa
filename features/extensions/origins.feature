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
