@timing
Feature: Continuity across a restart

  Background:
    Given the `continued.flow` task queue is empty
    And the `continued.tally` database is empty
    And the `continuity.journal` database is empty
    And the `continuity` service is staged

  Scenario: A run picks up after the process that attempted it was taken down

    The attempt that raised is tried again while the process is down, and taken by the process
    that comes back, which has nothing of the run but what was kept.

    Given I run components:
      | continued.tally |
      | continued.flow  |
    When I call `continued.flow.run` with:
      """yaml
      input:
        a: 0a000000000000000000000000000006
        b: 0b000000000000000000000000000006
        fail: 1
      task: true
      """
    And the process is halted for 30 seconds
    Then the process is running again
    And I wait 2 seconds
    And the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000006 | 1 |
      | 0b000000000000000000000000000006 | 1 |
