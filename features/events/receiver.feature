Feature: Work with nobody waiting for it

  An event a component receives, and a task, are handled with nobody waiting for an answer.
  A failure there is the message's problem and not the process's: what else the composition
  was doing goes on, and the message comes back.

  Background:
    Given the `mongo.faulty` event queues are empty
    And the `mongo.one` database contains:
      | _id                              | foo | bar   | VERSION |
      | 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30 | 0   | hello | 1       |
    And the `mongo.faulty` database contains:
      | _id                              | count | failing | VERSION |
      | 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30 | 0     | true    | 1       |

  Scenario: An event whose receiver throws is delivered again
    Given I compose components:
      | mongo.one    |
      | mongo.faulty |
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: world
      query:
        id: 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30
      """
    Then the reply is received
    And I wait 0.3 second
    # the composition answers, so the failure took nothing else with it
    When I call `mongo.faulty.mend` with:
      """yaml
      query:
        id: 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30
      """
    Then the reply is received
    And I wait 2 second
    When I call `mongo.faulty.observe` with:
      """yaml
      query:
        id: 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30
      """
    Then the reply is received:
      """yaml
      count: 1
      """

  Scenario: A task whose operation throws is delivered again
    Given I compose components:
      | mongo.one    |
      | mongo.faulty |
    When I call `mongo.faulty.increment` with:
      """yaml
      query:
        id: 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30
      task: true
      """
    And I wait 0.3 second
    # nobody is waiting for a task, so its failure is not the caller's to see
    When I call `mongo.faulty.mend` with:
      """yaml
      query:
        id: 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30
      """
    Then the reply is received
    And I wait 2 second
    When I call `mongo.faulty.observe` with:
      """yaml
      query:
        id: 5d2f9c1b7e0a4d3c8f6b2a1e9c4d7b30
      """
    Then the reply is received:
      """yaml
      count: 1
      """
