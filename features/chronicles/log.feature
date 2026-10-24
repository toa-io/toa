Feature: Chronicles

  A component's changes, as the events it names render them, the facts it sends and what browsers
  send are rows of the log, which the scribe consumes and writes.

  Background:
    Given the chronicles are empty
    And the `chronicled.orders` database is empty
    And an environment variable `TOA_CHRONICLES` is set to:
      """yaml
      store:
        provider: clickhouse
        url: http://localhost:31030/chronicles
      ingest: true
      events:
        - chronicled.orders.created
      states:
        - chronicled.orders.snapshot
      identities:
        chronicled.orders: customer
      """

  Scenario: A change is a row under each event the component names, and its state is kept
    Given I compose `chronicled.orders` component
    And the chronicles scribe is running
    When I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 120
        email: bob@example.com
        customer: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
      """
    Then the chronicles answer "SELECT label, component, entity, version, identity, toString(payload.email) AS email FROM events FINAL" within 30 seconds:
      """yaml
      - label: chronicled.orders.created
        component: chronicled.orders
        entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        version: 1
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        email: bob@example.com
      """
    And the chronicles answer "SELECT component, entity, version, identity, toString(payload.total) AS total, toString(payload.email) AS email FROM states FINAL" within 30 seconds:
      """yaml
      - component: chronicled.orders
        entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        version: 1
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        total: '120'
        email: ''
      """

  Scenario: The state of an entity is its latest version
    Given I compose `chronicled.orders` component
    And the chronicles scribe is running
    When I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 120
      """
    And I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 140
      """
    Then the chronicles answer "SELECT version, toString(payload.total) AS total FROM states FINAL WHERE component = 'chronicled.orders'" within 30 seconds:
      """yaml
      - version: 2
        total: '140'
      """

  Scenario: A fact a component sends
    Given an environment variable `TOA_CHRONICLES` is set to:
      """yaml
      store:
        provider: clickhouse
        url: http://localhost:31030/chronicles
      events: []
      states: []
      identities: {}
      """
    And I compose `chronicled.facts` component
    And the chronicles scribe is running
    When I call `chronicled.facts.search` with:
      """yaml
      input:
        query: teapot
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
      """
    Then the chronicles answer "SELECT label, isNull(entity) AS unentitled, identity, toString(payload.query) AS query FROM events" within 30 seconds:
      """yaml
      - label: chronicled.facts.searched
        unentitled: 1
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        query: teapot
      """

  Scenario: What is committed while the scribe is away is written once it is back
    Given I compose `chronicled.orders` component
    And the chronicles scribe is running
    When the chronicles scribe stops
    And I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 7
      """
    And I wait 2 seconds
    And the chronicles scribe is running
    Then the chronicles answer "SELECT label FROM events FINAL" within 30 seconds:
      """yaml
      - label: chronicled.orders.created
      """
    And the chronicles answer "SELECT version FROM states FINAL" within 30 seconds:
      """yaml
      - version: 1
      """

  Scenario: A state that does not say which entity it is, is refused and holds up nothing
    Given an environment variable `TOA_CHRONICLES` is set to:
      """yaml
      store:
        provider: clickhouse
        url: http://localhost:31030/chronicles
      events:
        - chronicled.orders.created
      states:
        - chronicled.stateless.summary
      identities: {}
      """
    And the `chronicled.stateless` database is empty
    And I compose components:
      | chronicled.orders    |
      | chronicled.stateless |
    And the chronicles scribe is running
    When I call `chronicled.stateless.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 3
      """
    And I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 5
      """
    Then the chronicles answer "SELECT label FROM events FINAL" within 30 seconds:
      """yaml
      - label: chronicled.orders.created
      """
    And the chronicles answer "SELECT count() AS n FROM states":
      """yaml
      - n: 0
      """
