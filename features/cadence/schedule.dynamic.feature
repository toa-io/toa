@timing
Feature: Schedules handed over

  An operation hands a schedule of an item's own over with `context.schedule`. It is stored as a
  row the dispatcher makes at every occurrence and moves on to the next, until it expires or is
  cancelled.

  Scenario: Calling at each occurrence
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.plan` with:
      """yaml
      input:
        schedule: '* * * * * *'
        note: hello
      """
    And I wait 4 seconds
    And I call `default.scheduling.marks` with:
      """yaml
      input:
        least: 3
      """
    Then the reply is received:
      """yaml
      enough: true
      consecutive: true
      repeated: false
      notes: [hello]
      """

  Scenario: Storing one row for a schedule
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.plan` with:
      """yaml
      input:
        schedule: 0 0 1 1 *
        zone: Europe/Berlin
      """
    Then the `cadence.metronome` database holds:
      | endpoint                 | schedule  | zone          | DELETED |
      | default.scheduling.mark  | 0 0 1 1 * | Europe/Berlin | null    |

  Scenario: The same schedule twice is one
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.twice` with:
      """yaml
      input:
        schedule: '* * * * * *'
        note: once
      """
    Then the reply is received:
      """yaml
      same: true
      """
    When I wait 3 seconds
    And I call `default.scheduling.marks`
    Then the reply is received:
      """yaml
      repeated: false
      consecutive: true
      """

  # Cancelled long before its first occurrence, so nothing had armed it.
  Scenario: Cancelling a schedule
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.vanish` with:
      """yaml
      input:
        schedule: 0 0 1 1 *
      """
    Then the `cadence.metronome` database holds:
      | endpoint                | DELETED            |
      | default.scheduling.mark | {"$type": "date"} |

  # Its id is what it is, so the one handed over again is the row that was cancelled, revived.
  Scenario: Handing a cancelled schedule over again
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.again` with:
      """yaml
      input:
        schedule: 0 0 1 1 *
      """
    Then the reply is received:
      """yaml
      same: true
      """
    And the `cadence.metronome` database holds:
      | endpoint                | DELETED |
      | default.scheduling.mark | null    |

  # Two seconds from now holds two occurrences of every second, whatever part of a second now is.
  Scenario: Ending at `expires`
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.plan` with:
      """yaml
      input:
        schedule: '* * * * * *'
        expires: 2000
      """
    And I wait 5 seconds
    And I call `default.scheduling.marks`
    Then the reply is received:
      """yaml
      count: 2
      """
    And the `cadence.metronome` database holds:
      | endpoint                | DELETED            |
      | default.scheduling.mark | {"$type": "date"} |

  # The row is seeded at this year's occurrence of a yearly schedule, as if nothing had run since:
  # owed until next year's, so it is made late and moved on.
  Scenario: Calling for an occurrence nothing was running at
    Given the `cadence.metronome` database contains:
      | _id                              | lane | due | expires          | endpoint                | schedule  | zone | request                      | VERSION |
      | 4b1d9fa52f1e4d0d9a1f0f4a3c6e7b21 | 0    | 1767225600000 | 9007199254740991 | default.scheduling.mark | 0 0 1 1 * | UTC  | {"input": {"note": "late"}} | 1       |
    And I compose `scheduling` component
    And the `cadence` service is staged
    When I wait 1 second
    And I call `default.scheduling.marks`
    Then the reply is received:
      """yaml
      count: 1
      notes: [late]
      late: true
      """
    And the `cadence.metronome` database holds:
      | _id                              | DELETED |
      | 4b1d9fa52f1e4d0d9a1f0f4a3c6e7b21 | null    |

  # Seeded an hour late with a bound of a minute: lapsed, so not made, and moved on rather than
  # ended.
  Scenario: Not calling an occurrence past its bound, and going on
    Given the `cadence.metronome` database contains:
      | _id                              | lane | due | expires          | endpoint                | schedule    | zone | overdue | request                      | VERSION |
      | 4b1d9fa52f1e4d0d9a1f0f4a3c6e7b21 | 0    | 1   | 9007199254740991 | default.scheduling.mark | * * * * * * | UTC  | 60000   | {"input": {"note": "late"}} | 1       |
    And I compose `scheduling` component
    And the `cadence` service is staged
    When I wait 3 seconds
    And I call `default.scheduling.marks`
    Then the reply is received:
      """yaml
      enough: true
      late: false
      """

  Scenario: A target that will never take the call ends the schedule
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.plan` with:
      """yaml
      input:
        schedule: '* * * * * *'
        target: default.scheduling.strict
      """
    Then the `cadence.metronome` database holds within 3 seconds:
      | endpoint                  | DELETED            |
      | default.scheduling.strict | {"$type": "date"} |

  Scenario Outline: Refusing what does not parse
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.plan` with:
      """yaml
      input: <input>
      """
    Then the following exception is thrown:
      """yaml
      code: 202
      """
    And the `cadence.metronome` database holds nothing

    Examples:
      | input                                                         |
      | { schedule: 'every day' }                                     |
      | { schedule: '0 9 * * *', zone: Mars/Olympus }                 |
      | { schedule: '0 9 * * *', expires: -1000 }                     |
      | { schedule: '0 9 * * *', input: { at: 1 } }                   |
      | { schedule: '0 9 * * *', input: hello }                       |

  Scenario: Not storing one from a chain that may only read
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduling` component
    When I call `default.scheduling.peek` with:
      """yaml
      readonly: true
      input:
        schedule: 0 0 1 1 *
      """
    Then the following exception is thrown:
      """yaml
      code: 406
      """
