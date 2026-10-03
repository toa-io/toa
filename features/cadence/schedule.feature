@timing
Feature: Schedule

  A component calls its own operation at the moments its manifest states as a cron expression.
  Each occurrence is a delayed call, stored one occurrence ahead by the component that declares
  it, and made by the dispatcher that makes every delayed call.

  # The fixture is scheduled for every second and records the moment each call was for. Five
  # seconds of it, and three calls asked for: the first second is spent booting.
  Scenario: Calling at each occurrence
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduled` component
    And I wait 5 seconds
    When I call `default.scheduled.marks` with:
      """yaml
      input:
        least: 3
      """
    Then the reply is received:
      """yaml
      enough: true
      consecutive: true
      """

  # An occurrence is stored as soon as there is a component to declare it, a year ahead as
  # readily as a second.
  Scenario: Storing the next occurrence ahead
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    When I compose `scheduled` component
    And I wait 1 second
    Then the `cadence.metronome` database holds:
      | endpoint                 |
      | default.scheduled.yearly |

  # The fixture declares a schedule and a pulse for a rank nothing here is deployed as.
  Scenario: Not making an entry of another region
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduled` component
    And I wait 3 seconds
    When I call `default.scheduled.marks` with:
      """yaml
      input:
        least: 1
      """
    Then the reply is received:
      """yaml
      enough: true
      foreign: 0
      """

  # The occurrence was stored before everything went away, and the fixture gives it a minute to
  # be late in: it is made once something is running again, and says which moment it was for.
  Scenario: Calling for an occurrence nothing was running at
    Given the `cadence.metronome` database is empty
    And the `cadence` service is staged
    And I compose `scheduled` component
    And I wait 1 second
    And the stage is stopped
    And I wait 2 seconds
    When the `cadence` service is staged
    And I compose `scheduled` component
    And I wait 1 second
    And I call `default.scheduled.marks` with:
      """yaml
      input:
        least: 0
      """
    Then the reply is received:
      """yaml
      late: true
      """

  # Two replicas of one component are two processes, so one of them is run as one. Both store
  # every occurrence and one row is kept, so each moment is recorded once between them, in a
  # file they share.
  @cli
  Scenario: Calling once however many replicas there are
    Given my working directory is .
    And the `cadence.metronome` database is empty
    And I have a component `scheduled`
    And I have a context with:
      """yaml
      mongodb: mongodb://localhost:31020
      amqp:
        context: amqp://localhost:31010
      """
    And an environment variable `MARKS` is set to "marks"
    When I run `toa env`
    And I run `toa map`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    And I run `TOA_DEV=0 toa compose ./components/scheduled`
    And the `cadence` service is staged
    And I compose `scheduled` component
    And I wait 6 seconds
    And I abort execution
    Then the file ./marks contains no repeated lines
