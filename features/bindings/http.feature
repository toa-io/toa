Feature: Streamed calls over HTTP

  A call that carries a stream is carried to the component's address, and nothing else is.

  Background:
    Given calls within this process go through a binding
    And an environment variable `TOA_HTTP` is set to:
      """yaml
      streams.remote: http://127.0.0.1:31006
      """

  Scenario: An operation reads a stream from another process
    Given I compose components:
      | streams.source |
      | streams.remote |
    When I call `streams.source.dispatch` with:
      """yaml
      input:
        label: pot
        chunks: 64
      """
    Then the reply is received:
      """yaml
      label: pot
      size: 65536
      type: null
      """
    And I disconnect

  Scenario: The bytes flow rather than land
    Given I compose components:
      | streams.source |
      | streams.remote |
    When I call `streams.source.spread` with:
      """yaml
      input:
        chunks: 10
      """
    Then the reply is received:
      """yaml
      flowing: true
      """
    And I disconnect

  Scenario: An ordinary call to the same component goes over the broker
    Given I compose components:
      | streams.source |
      | streams.remote |
    When I call `streams.remote.count` with:
      """yaml
      input:
        of: 21
      """
    Then the reply is received:
      """yaml
      42
      """
    And I disconnect

  Scenario: A component nothing answers for fails a streamed call
    Given the component map states:
      | streams.remote |
    And I compose `streams.source` component
    When I call `streams.source.dispatch` with:
      """yaml
      input:
        label: nobody
        chunks: 1
      """
    Then the following exception is thrown:
      """yaml
      code: 407
      """
    And I disconnect

  Scenario: An operation answers a stream of values
    Given I compose components:
      | streams.source |
      | streams.remote |
    When I call `streams.source.collect` with:
      """yaml
      input:
        chunks: 3
      """
    Then the reply is received:
      """yaml
      - index: 0
        size: 8
      - index: 1
        size: 8
      - index: 2
        size: 8
      """
    And I disconnect

  Scenario: An operation answers bytes
    Given I compose components:
      | streams.source |
      | streams.remote |
    When I call `streams.source.bytes` with:
      """yaml
      input:
        chunks: 4
      """
    Then the reply is received:
      """yaml
      size: 64
      buffers: true
      """
    And I disconnect

  Scenario: A reply stream that fails after its first value fails the read
    Given I compose components:
      | streams.source |
      | streams.remote |
    When I call `streams.source.broken` with:
      """yaml
      input:
        chunks: 5
      """
    Then the reply is received:
      """yaml
      read: 2
      failed: true
      """
    And I disconnect
