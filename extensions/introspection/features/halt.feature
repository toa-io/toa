@halt
Feature: Halt

  A process is told to stop by a signal anyone with the role may write, and stops by
  closing everything it holds — the database, the cache, the broker — while staying up.
  It builds itself again when the interval it was given is over, and nothing has to
  reach it for that to happen.

  Scenario: A signalled process closes everything it holds
    Given a running process
    When a halt of 30 seconds is signalled
    Then the process holds no connection

  @timing
  Scenario: A halted process comes back on its own
    Given a running process
    When a halt of 30 seconds is signalled
    Then the process holds no connection
    And the process holds connections again
