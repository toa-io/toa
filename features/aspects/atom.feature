Feature: Atom aspect

  Every component has `context.atom`, with nothing declared in its manifest.

  # One replica of the group owns every slot, once two intervals have agreed on it.
  Scenario: Owning slots
    Given I boot `atom` component
    And I wait 1 second
    When I invoke `slots` with:
      """yaml
      input:
        total: 4
      """
    Then the reply is received:
      """yaml
      [0, 1, 2, 3]
      """

  # A key that did not exist owes exactly what is put on it, which is what makes the
  # first number assertable; the second only has to be larger, because between two
  # round trips the debt has drained by however long they took.
  Scenario: Metering
    Given I boot `atom` component
    When I invoke `meter` with:
      """yaml
      input:
        name: bursts
        delta: 60000
      """
    Then the reply is received:
      """yaml
      debt: 60000
      adds: true
      """

  # Both calls read the counter, yield, and write it back. Unheld, both would read the same
  # value and answer 1.
  Scenario: Holding a lock
    Given I compose `atom` component
    When I call `default.atom.locks` with:
      """yaml
      input: {}
      """
    Then the reply is received:
      """yaml
      [1, 2]
      """

  # The routine runs for a whole lease, so the lock is held only if it is extended.
  Scenario: Holding a lock across a lease
    Given I compose `atom` component
    When I call `default.atom.locks` with:
      """yaml
      input:
        delay: 5000
      """
    Then the reply is received:
      """yaml
      [1, 2]
      """
