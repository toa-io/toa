Feature: A circle of components does not run forever

  Two components each receiving the other's `sync` write to each other for as long as the
  broker will carry it, and every operation on the way succeeds. What stops it is the chain a
  call carries: a component that has already been here twice refuses the third.

  Background:
    Given the `cycle.ping` event queues are empty
    And the `cycle.pong` event queues are empty
    And the `cycle.ping` database contains:
      | _id                              | count | VERSION |
      | ff0431dac0e14fce95c4496c21086781 | 0     | 1       |
    And the `cycle.pong` database contains:
      | _id                              | count | VERSION |
      | ff0431dac0e14fce95c4496c21086781 | 0     | 1       |

  Scenario: Two components that receive each other's events settle
    Given I compose components:
      | cycle.ping |
      | cycle.pong |
    When I call `cycle.ping.increment` with:
      """yaml
      input: null
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    And I wait 1 second
    # the chain is refused before a third visit commits, so each stops at two
    When I call `cycle.ping.observe` with:
      """yaml
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      count: 2
      """
    When I call `cycle.pong.observe` with:
      """yaml
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      count: 2
      """

  Scenario: The composition is still answering afterwards
    Given I compose components:
      | cycle.ping |
      | cycle.pong |
    When I call `cycle.ping.increment` with:
      """yaml
      input: null
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    And I wait 1 second
    # a refused message is set aside; nothing died for it
    When I call `cycle.pong.observe` with:
      """yaml
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    Then the reply is received
