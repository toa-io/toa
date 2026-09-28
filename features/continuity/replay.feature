Feature: Continuity

  An effect declared under `continuity` picks up where it failed: a later attempt of a run is
  given back what its context answered on an earlier one, and makes only what had not answered.

  The `continued.tally` component counts how many times each step was made, by its id. `run`
  bumps `a`, raises on its first `fail` attempts, and then bumps `b`; `plain` does the same and is
  not continued.

  Background:
    Given the `continued.tally` database is empty
    And the `continuity.journal` database is empty
    And the `continuity` service is staged
    And I compose components:
      | continued.tally |
      | continued.flow  |

  Scenario: What an attempt that raised had made is not made again
    When I call `continued.flow.run` with:
      """yaml
      input:
        a: 0a000000000000000000000000000001
        b: 0b000000000000000000000000000001
        fail: 1
      task: true
      """
    And I wait 3 seconds
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000001 | 1 |
      | 0b000000000000000000000000000001 | 1 |

  Scenario: What is not continued is made again
    When I call `continued.flow.plain` with:
      """yaml
      input:
        a: 0a000000000000000000000000000002
        b: 0b000000000000000000000000000002
        fail: 1
      task: true
      """
    And I wait 3 seconds
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000002 | 2 |
      | 0b000000000000000000000000000002 | 1 |

  Scenario: Concurrent branches are each given their own answer

    The two branches ask in one order on the first attempt and in the other on the second, and
    each fails the run if it is given the answer to the other.

    When I call `continued.flow.crossed` with:
      """yaml
      input:
        a: 0a000000000000000000000000000003
        b: 0b000000000000000000000000000003
        c: 0c000000000000000000000000000003
        fail: 1
      task: true
      """
    And I wait 3 seconds
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000003 | 1 |
      | 0b000000000000000000000000000003 | 1 |
      | 0c000000000000000000000000000003 | 1 |

  Scenario: Time, randomness and ids are given back
    When I call `continued.flow.stamped` with:
      """yaml
      input:
        a: 0a000000000000000000000000000004
        b: 0b000000000000000000000000000004
        fail: 1
      task: true
      """
    And I wait 3 seconds
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000004 | 1 |
      | 0b000000000000000000000000000004 | 1 |

  Scenario: A run delivered again after it finished makes nothing
    When I call `continued.flow.run` with:
      """yaml
      id: 3d000000000000000000000000000005
      input:
        a: 0a000000000000000000000000000005
        b: 0b000000000000000000000000000005
        fail: 0
      task: true
      """
    And I wait 1 second
    And I call `continued.flow.run` with:
      """yaml
      id: 3d000000000000000000000000000005
      input:
        a: 0a000000000000000000000000000005
        b: 0b000000000000000000000000000005
        fail: 0
      task: true
      """
    And I wait 1 second
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000005 | 1 |
      | 0b000000000000000000000000000005 | 1 |

  Scenario: A run picks up after the process that attempted it went down
    When I call `continued.flow.run` with:
      """yaml
      input:
        a: 0a000000000000000000000000000006
        b: 0b000000000000000000000000000006
        fail: 1
      task: true
      """
    And I disconnect
    And I compose components:
      | continued.tally |
      | continued.flow  |
    And I wait 3 seconds
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000006 | 1 |
      | 0b000000000000000000000000000006 | 1 |

  Scenario: A fetch that answered is not sent again
    Given an HTTP endpoint responds with statuses "200"
    When I call `continued.flow.fetched` with:
      """yaml
      input:
        a: 0a000000000000000000000000000007
        b: 0b000000000000000000000000000007
        fail: 1
      task: true
      """
    And I wait 3 seconds
    Then the HTTP endpoint has been asked 1 time
    And the `continued.tally` database holds:
      | _id                              | n |
      | 0b000000000000000000000000000007 | 1 |

  Scenario: An event is continued as a task is
    Given I compose `continued.source` component
    When I call `continued.source.create` with:
      """yaml
      input:
        a: 0a000000000000000000000000000008
        b: 0b000000000000000000000000000008
        fail: 1
      """
    And I wait 3 seconds
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000008 | 1 |
      | 0b000000000000000000000000000008 | 1 |
