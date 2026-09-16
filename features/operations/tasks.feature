Feature: Tasks

  A task is a call nobody waits for. Every task a component is given arrives on one queue,
  whichever of its operations it names.

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1       |
      | 3b1d7e4a95c04f2f8a6c0d1e2f3a4b5c | 0   | hello | 1       |

  Scenario: Sending a task
    Given I compose `mongo.one` component
    When I call `mongo.one.assign` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        bar: bye
      task: true
      """
    Then the reply is received:
      """yaml
      null
      """
    Then I call `mongo.one.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 0
      bar: bye
      VERSION: 2
      """

  Scenario: Tasks for two operations each reach the one they name

    One queue carries them all, so what says which operation to run is the message rather
    than the queue it arrived on.

    Given I compose `mongo.one` component
    When I call `mongo.one.assign` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        bar: bye
      task: true
      """
    And I call `mongo.one.transit` with:
      """yaml
      query:
        id: 3b1d7e4a95c04f2f8a6c0d1e2f3a4b5c
      input:
        foo: 7
      task: true
      """
    And I wait 1 second
    Then I call `mongo.one.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 0
      bar: bye
      VERSION: 2
      """
    Then I call `mongo.one.observe` with:
      """yaml
      query:
        id: 3b1d7e4a95c04f2f8a6c0d1e2f3a4b5c
      """
    Then the reply is received:
      """yaml
      id: 3b1d7e4a95c04f2f8a6c0d1e2f3a4b5c
      foo: 7
      bar: hello
      VERSION: 2
      """

  Scenario: A component consumes one task queue

    What the broker holds for a component's tasks does not grow with the operations it
    declares.

    Given I compose `mongo.one` component
    Then `mongo.one` consumes 1 task queue

  Scenario: A task for an operation the component does not serve is kept at once

    A caller upgraded ahead of this component names an operation it does not have. Trying
    it again cannot make it known.

    Given the parked queue is empty
    And I compose `mongo.one` component
    When a task naming `absent` is published to `mongo.one`
    Then `mongo.one` keeps the task at once, saying it named `absent`
