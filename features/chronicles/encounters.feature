Feature: What clients send to the log

  Background:
    Given the chronicles are empty
    And the encounters are documented:
      """yaml
      page_viewed:
        description: A page was shown
        fields:
          path: The URL path, without the query
      """
    And the chronicles scribe is running

  Scenario: A batch is a row of `encounters` for each event, of the visitor and the session
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        visitor: v1
        session: s1
        events:
          - id: c1
            name: page_viewed
            time: 1761200000000
            payload:
              path: /pricing
          - id: c2
            name: button_clicked
            time: 1761200001000
      """
    Then the reply is received:
      """yaml
      status: 202
      accepted: 2
      """
    And the chronicles answer "SELECT id, name, visitor, session, identity, toUnixTimestamp64Milli(time) AS time, toString(payload.path) AS path FROM encounters FINAL ORDER BY id" within 30 seconds:
      """yaml
      - id: c1
        name: page_viewed
        visitor: v1
        session: s1
        identity: null
        time: 1761200000000
        path: /pricing
      - id: c2
        name: button_clicked
        visitor: v1
        session: s1
        identity: null
        time: 1761200001000
        path: ''
      """
    And the chronicles answer "SELECT count() AS n FROM events":
      """yaml
      - n: 0
      """

  Scenario: A batch of an identity has the visitor that sent it
    When I call `chronicles.encounters.identified` with:
      """yaml
      input:
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        visitor: v1
        events:
          - id: i1
            name: page_viewed
            time: 1761200000000
      """
    Then the chronicles answer "SELECT visitor, identity, session FROM encounters" within 30 seconds:
      """yaml
      - visitor: v1
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        session: null
      """

  Scenario: The client's clock is kept as it says, and the row by when it was received
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        events:
          - id: f1
            name: page_viewed
            time: 4102444800000
          - id: f2
            name: page_viewed
            time: 0
      """
    Then the chronicles answer "SELECT id, toUnixTimestamp64Milli(time) AS time, received > now64(3) - INTERVAL 1 MINUTE AS recent FROM encounters ORDER BY id" within 30 seconds:
      """yaml
      - id: f1
        time: 4102444800000
        recent: 1
      - id: f2
        time: 0
        recent: 1
      """
    And the chronicles answer "SELECT count() AS n FROM system.parts WHERE database = 'toa-dev' AND table = 'encounters' AND active AND partition != toString(toYYYYMM(now()))":
      """yaml
      - n: 0
      """

  Scenario: A payload is written as it was sent
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        events:
          - id: p1
            name: page_viewed
            time: 1761200000000
            payload:
              path: /pricing
              utm:
                source: newsletter
      """
    Then the chronicles answer "SELECT arraySort(JSONAllPaths(payload)) AS paths FROM encounters" within 30 seconds:
      """yaml
      - paths: [path, utm.source]
      """

  Scenario: The network of the client's address, and its country
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        ip: 203.0.113.7
        country: DE
        events:
          - id: n1
            name: page_viewed
            time: 1761200000000
      """
    Then the chronicles answer "SELECT ip, country FROM encounters" within 30 seconds:
      """yaml
      - ip: 203.0.113.0
        country: DE
      """

  Scenario: The origin and the agent of the client, and what the agent is
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        origin: https://store.example
        agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1
        events:
          - id: o1
            name: page_viewed
            time: 1761200000000
      """
    Then the chronicles answer "SELECT origin, startsWith(agent, 'Mozilla/5.0 (iPhone') AS kept, browser, os, device FROM encounters" within 30 seconds:
      """yaml
      - origin: https://store.example
        kept: 1
        browser: Safari
        os: iOS
        device: mobile
      """

  Scenario: A client that says nothing of itself
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        events:
          - id: o2
            name: page_viewed
            time: 1761200000000
      """
    Then the chronicles answer "SELECT origin, agent, browser, os, device FROM encounters" within 30 seconds:
      """yaml
      - origin: null
        agent: null
        browser: null
        os: null
        device: null
      """

  Scenario: A batch sent as a form, as `navigator.sendBeacon` sends it
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        visitor: v1
        events: '[{"id":"b1","name":"page_left","time":1761200000000}]'
      """
    Then the reply is received:
      """yaml
      accepted: 1
      """
    And the chronicles answer "SELECT name, visitor FROM encounters" within 30 seconds:
      """yaml
      - name: page_left
        visitor: v1
      """

  Scenario: An event sent again is one row
    When I call `chronicles.encounters.anonymous` 2 times with:
      """yaml
      input:
        events:
          - id: r1
            name: page_viewed
            time: 1761200000000
      """
    Then the chronicles answer "SELECT count() AS n FROM encounters FINAL" within 30 seconds:
      """yaml
      - n: 1
      """

  Scenario Outline: A batch that is not events
    When I call `chronicles.encounters.anonymous` with:
      """yaml
      input: <input>
      """
    Then the error is received:
      """yaml
      code: INVALID
      """

    Examples:
      | input                                                                   |
      | { events: 'not json' }                                                  |
      | { events: [{ id: a, name: Page, time: 1 }] }                            |
      | { events: [{ id: a, name: page.viewed, time: 1 }] }                     |
      | { events: [{ id: a, name: page, time: -1 }] }                           |
      | { events: [{ id: a, name: page, time: 1, user: bob }] }                 |
      | { events: [{ id: '', name: page, time: 1 }] }                           |
      | { events: [{ id: a, name: page, time: 1, payload: [1] }] }              |
      | { events: [{ id: a, name: page, time: 1 }], identity: 9c1f0a6d5b7e4f3a } |
      | { events: [], visitor: '' }                                             |
      | { events: [], session: 7 }                                              |
      | { events: [], visitor: vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv } |

  Scenario: What the encounters are
    When I call `chronicles.encounters.describe`
    Then the reply is received:
      """yaml
      page_viewed:
        description: A page was shown
        fields:
          path: The URL path, without the query
      """
