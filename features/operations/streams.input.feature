Feature: Streamed input

  An operation may take one of its input properties as a stream, and reads what its caller
  writes while it is being written.

  Background:
    Given I compose components:
      | streams.source |
      | streams.sink   |

  Scenario: Reading a stream from a caller
    When I call `streams.source.send` with:
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

  Scenario: A streamed call is not a task
    When I call `streams.source.enqueue` with:
      """yaml
      input:
        chunks: 8
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """
    And I disconnect

  Scenario: An operation that takes a stream is not called without one
    When I call `streams.source.omit` with:
      """yaml
      input:
        label: pot
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """
    And I disconnect
