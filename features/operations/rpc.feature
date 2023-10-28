Feature: RPC

  Scenario: Send a request and receive a reply
    Given I compose `echo.beacon` component
    When I call `echo.beacon.echo` with:
      """yaml
      input: ok
      """
    Then the reply is received:
      """yaml
      ok
      """
    And I disconnect

  Scenario: Consume a stream
    Given I compose `streams.numbers` component
    When I call `streams.numbers.generate` with:
      """yaml
      input:
        limit: 5
      """
    Then the reply stream is received:
      """yaml
      [0, 1, 2, 3, 4]
      """
    And I disconnect

  Scenario: Consuming a stream from a remote
    Given I compose components:
      | streams.numbers    |
      | streams.aggregator |
    When I call `streams.aggregator.sum` with:
      """yaml
      input:
        limit: 5
      """
    Then the reply is received:
      """yaml
      10
      """
    And I disconnect
