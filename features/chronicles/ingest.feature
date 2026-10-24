Feature: What browsers send to the log

  Background:
    Given the chronicles are empty
    And the chronicles scribe is running

  Scenario: A batch is written under `client.`
    When I call `chronicles.ingestion.anonymous` with:
      """yaml
      input:
        events:
          - id: c1
            name: page.viewed
            time: 1761200000000
            payload:
              path: /pricing
          - id: c2
            name: button.clicked
            time: 1761200001000
      """
    Then the reply is received:
      """yaml
      status: 202
      accepted: 2
      """
    And the chronicles answer "SELECT id, label, component, identity, toUnixTimestamp64Milli(time) AS time, toString(payload.path) AS path FROM events FINAL ORDER BY id" within 30 seconds:
      """yaml
      - id: c1
        label: client.page.viewed
        component: chronicles.ingestion
        identity: null
        time: 1761200000000
        path: /pricing
      - id: c2
        label: client.button.clicked
        component: chronicles.ingestion
        identity: null
        time: 1761200001000
        path: ''
      """

  Scenario: A batch of an identity
    When I call `chronicles.ingestion.identified` with:
      """yaml
      input:
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        events:
          - id: i1
            name: page.viewed
            time: 1761200000000
      """
    Then the chronicles answer "SELECT identity FROM events" within 30 seconds:
      """yaml
      - identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
      """

  Scenario: A batch sent as text, as `navigator.sendBeacon` sends it
    When I call `chronicles.ingestion.anonymous` with:
      """yaml
      input: '{"events":[{"id":"b1","name":"page.left","time":1761200000000}]}'
      """
    Then the reply is received:
      """yaml
      accepted: 1
      """
    And the chronicles answer "SELECT label FROM events" within 30 seconds:
      """yaml
      - label: client.page.left
      """

  Scenario: An event sent again is one row
    When I call `chronicles.ingestion.anonymous` 2 times with:
      """yaml
      input:
        events:
          - id: r1
            name: page.viewed
            time: 1761200000000
      """
    Then the chronicles answer "SELECT count() AS n FROM events FINAL" within 30 seconds:
      """yaml
      - n: 1
      """

  Scenario Outline: A batch that is not events
    When I call `chronicles.ingestion.anonymous` with:
      """yaml
      input: <input>
      """
    Then the error is received:
      """yaml
      code: INVALID
      """

    Examples:
      | input                                                                   |
      | 'not json'                                                              |
      | { events: [{ id: a, name: Page, time: 1 }] }                            |
      | { events: [{ id: a, name: page, time: -1 }] }                           |
      | { events: [{ id: a, name: page, time: 1, user: bob }] }                 |
      | { events: [{ id: '', name: page, time: 1 }] }                           |
      | { events: [{ id: a, name: page, time: 1, payload: [1] }] }              |
      | { events: [{ id: a, name: page, time: 1 }], identity: 9c1f0a6d5b7e4f3a } |
