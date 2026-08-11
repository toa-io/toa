Feature: Fetch

  Scenario: Built-in fetch retries unexpected responses and records telemetry
    Given an HTTP endpoint responds with statuses "503, 201"
    And I boot `fetch` component
    And I capture fetch spans
    When I invoke `request` with:
      """yaml
      input:
        method: POST
        retry:
          attempts: 3
          expected: [201]
          delay: 0
      """
    Then the reply is received:
      """yaml
      status: 201
      attempt: 2
      """
    And a fetch span tree is recorded:
      """yaml
      method: POST
      status: 201
      attempts: 2
      """
    And I disconnect

  Scenario: Fetch does not retry by default
    Given an HTTP endpoint responds with statuses "503, 201"
    And I boot `fetch` component
    When I invoke `request` with:
      """yaml
      input:
        method: GET
      """
    Then the reply is received:
      """yaml
      status: 503
      attempt: 1
      """
    And I disconnect
