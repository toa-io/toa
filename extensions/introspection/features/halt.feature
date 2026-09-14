@halt
Feature: Halt

  A deployment is told to halt by a signal anyone with the role may write. Every process goes
  quiet — it stops doing anything of its own accord, and closes nothing — and then the map
  says whether the deployment went quiet with it: an edge is written by a call, so a region
  with no edge newer than the signal is a region where nothing was called.

  Whichever process sees that calls the stop, and the rest obey it without consulting their
  own view. Where anything was still working, or where the map could not be read, the halt is
  called off and every process carries on with what it never let go of.

  Scenario: A quiet deployment stops
    Given a running deployment
    When a halt of 30 seconds is signalled
    Then every process holds no connection

  @timing
  Scenario: A halted deployment comes back on its own
    Given a running deployment
    When a halt of 30 seconds is signalled
    Then every process holds no connection
    And every process holds connections again

  Scenario: A deployment that is working is not stopped
    Given a running deployment with a component that keeps its own time
    When a halt of 30 seconds is signalled
    Then every process goes quiet
    And every process works again, holding what it held

  Scenario: A deployment whose map cannot be read is not stopped
    Given a running deployment
    When a halt of 30 seconds is signalled
    And every process goes quiet
    And the explorer is killed
    Then every process works again, holding what it held
