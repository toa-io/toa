Feature: A process going quiet

  The runtime stops what it does of its own accord and holds every connection open, so that what
  is half-way through runs to the end and nothing new begins.

  Scenario: What a component stopped it starts again
    Given I compose `rc.quiet` component
    When the process goes quiet
    And the process is working again
    And I call `rc.quiet.marks`
    Then the reply is received:
      """yaml
      - stop
      - resume
      """

  Scenario: A call made through a tree that has been taken down is refused
    Given I boot `rc.ok` component
    And I disconnect
    Then invoking `echo` is refused as disposed
