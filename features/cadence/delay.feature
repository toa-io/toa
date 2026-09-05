Feature: Delayed calls

  A component hands a call over to be made later. The rows live in the component the extension
  ships, and its dispatcher makes the call when it comes due.

  Scenario: Calling later
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `delaying` component
    When I call `default.delaying.later` with:
      """yaml
      input:
        note: hello
        delay: 300
      """
    And I wait 2 seconds
    And I call `default.delaying.marks`
    Then the reply is received:
      """yaml
      - hello
      """

  Scenario: Not before it is due
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `delaying` component
    When I call `default.delaying.later` with:
      """yaml
      input:
        note: later
        delay: 60000
      """
    And I wait 1 second
    And I call `default.delaying.marks`
    Then the reply is received:
      """yaml
      []
      """

  # The id a call is given is what cancels it, which is what a horizon of months needs.
  # Far enough out not to have been armed: a call already held by a timer is past cancelling.
  Scenario: Cancelling a call
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `delaying` component
    When I call `default.delaying.vanish` with:
      """yaml
      input:
        note: never
        delay: 60000
      """
    And I wait 2 seconds
    And I call `default.delaying.marks`
    Then the reply is received:
      """yaml
      []
      """

  # A call that takes no request at all: the row carries no `request`, rather than a null one.
  Scenario: Calling with nothing to say
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `delaying` component
    When I call `default.delaying.ping` with:
      """yaml
      input:
        delay: 300
      """
    And I wait 2 seconds
    And I call `default.delaying.marks`
    Then the reply is received:
      """yaml
      - pong
      """

  # A call whose time passed while nothing was running to make it. Seeding the row directly is
  # that state: the next scan reads it along with what is coming, and makes it at once.
  Scenario: Calling one that is already overdue
    Given the `cadence.metronome` database contains:
      | _id                              | lane | due | expires          | endpoint              | _version |
      | 01a06fa7e5e676b3aefdad34be3d184a | 0    | 1   | 9007199254740991 | default.delaying.pong | 1        |
    And the `cadence` service is staged
    And I compose `delaying` component
    When I wait 1 second
    And I call `default.delaying.marks`
    Then the reply is received:
      """yaml
      - pong
      """

  # A call nothing was running to make in time. Nothing notices it go: the scan bounds on
  # `expires`, so what is left is a row nobody reads.
  Scenario: Not calling one that is too late
    Given the `cadence.metronome` database contains:
      | _id                              | lane | due | expires | endpoint              | _version |
      | 01a06fa7e5e676b3aefdad34be3d184a | 0    | 1   | 2       | default.delaying.pong | 1        |
    And the `cadence` service is staged
    And I compose `delaying` component
    When I wait 1 second
    And I call `default.delaying.marks`
    Then the reply is received:
      """yaml
      []
      """

  # Due at once and allowed one millisecond of lateness, which no scan can be quick enough for.
  Scenario: Stating how late is too late
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `delaying` component
    When I call `default.delaying.ping` with:
      """yaml
      input:
        delay: 0
        overdue: 1
      """
    And I wait 1 second
    And I call `default.delaying.marks`
    Then the reply is received:
      """yaml
      []
      """
