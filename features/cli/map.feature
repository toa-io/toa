@cli
Feature: toa map

  What a process is given about the components of a Context: the version each of them runs, and
  what that version provides.

  Scenario: Show `toa map` help
    When I run `toa map --help`
    And stdout should contain lines:
      """
      toa map [environment]
      Export component contracts to a .map.json file
      """

  Scenario: Writing the map of a Context
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the file ./.map.json contains line starting with '"dummies.one":'
    And the file ./.map.json contains line starting with '"dummies.two":'

  Scenario: A contract is what a call is made from
    Given I have a component `events.trailers`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states for `events.trailers`:
      """yaml
      bindings: ["@toa.io/bindings.amqp"]
      entity:
        properties:
          foo:
            type: integer
      operations:
        transit:
          type: transition
          scope: object
          input:
            type: object
            properties:
              inc:
                type: integer
      events:
        incremented:
          binding: "@toa.io/bindings.amqp"
      """

  Scenario: What the runtime gives every entity is not in it
    Given I have a component `events.trailers`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states for `events.trailers`:
      """yaml
      entity:
        system: true
      """
    And the map states no `entity.properties.id` of `events.trailers`
    And the map states no `entity.properties.VERSION` of `events.trailers`
    And the map states no `entity.properties.CREATED` of `events.trailers`
    And the map states no `entity.properties.UPDATED` of `events.trailers`
    And the map states no `entity.properties.DELETED` of `events.trailers`
    And the map states no `entity.properties.REGION` of `events.trailers`
    And the map states no `entity.required` of `events.trailers`

  Scenario: A component that declares its entity itself keeps it
    Given I have a component `proto.plain`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states for `proto.plain`:
      """yaml
      entity:
        properties:
          VERSION:
            type: integer
            minimum: 0
          CREATED:
            type: integer
        required: [id]
      """
    And the map states no `entity.system` of `proto.plain`

  Scenario: A component that names `id` itself keeps it
    Given I have a component `custom.id`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states for `custom.id`:
      """yaml
      entity:
        properties:
          id:
            type: number
        system: true
      """
    And the map states no `entity.properties.VERSION` of `custom.id`

  Scenario: An operation states its bindings only where they are its own
    Given I have a component `events.trailers`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states for `events.trailers`:
      """yaml
      bindings: ["@toa.io/bindings.amqp"]
      """
    And the map states no `operations.transit.bindings` of `events.trailers`

  Scenario: What an operation does not declare is not in it
    Given I have a component `contracts.peer`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states for `contracts.peer`:
      """yaml
      operations:
        serves:
          type: computation
          scope: none
      """
    And the map states no `operations.serves.output` of `contracts.peer`
    And the map states no `operations.serves.query` of `contracts.peer`

  Scenario: How a component serves a call is its own
    Given I have a component `events.trailers`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states no `operations.transit.concurrency` of `events.trailers`
    And the map states no `entity.storage` of `events.trailers`
    And the map states no `entity.blank` of `events.trailers`

  Scenario: Nothing of the machine it was written on is in it
    Given I have a component `events.trailers`
    And I have a context
    When I run `toa map`
    Then program should exit with code 0
    And the map states no `events.incremented.path` of `events.trailers`

  Scenario: An evicted component is in it
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      evicted:
        components:
          - dummies.two
      """
    When I run `toa map`
    Then program should exit with code 0
    And the file ./.map.json contains line starting with '"dummies.two":'

  Scenario: A composition is refused where a Context has no map
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa compose ./components/* --kill`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Run `toa map` to write one, or name one with `--map`.
      """

  Scenario: A composition the map states another version of is refused
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa map`
    And the sources of `dummies.one` change
    And I run `toa compose ./components/* --kill`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      'dummies.one' is composed at a version the component map does not state. Run `toa map`.
      """

  Scenario: What a component ignores is not part of its version
    Given I have a component `dummies.ignores`
    And I have a context
    When I run `toa map`
    And the file notes.md of `dummies.ignores` changes
    And I run `toa compose ./components/* --kill`
    Then program should exit with code 0

  Scenario: What a component links is part of its version
    Given I have a component `dummies.one`
    And `dummies.one` links sources of the workspace
    And I have a context
    When I run `toa map`
    And the file shared/linked.js of `dummies.one` changes
    And I run `toa compose ./components/* --kill`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      'dummies.one' is composed at a version the component map does not state. Run `toa map`.
      """

  Scenario: What `files` leaves out is not part of its version
    Given I have a component `dummies.files`
    And I have a context
    When I run `toa map`
    And the file notes.md of `dummies.files` changes
    And I run `toa compose ./components/* --kill`
    Then program should exit with code 0

  Scenario: A component outside a Context needs none
    Given I have a component `dummies.one`
    When I run `toa compose ./components/* --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Composition shutdown complete
      """
