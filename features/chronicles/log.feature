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
        - chronicled.orders.snapshot
        - chronicled.orders.created
      """

  Scenario: A change is written under each event the component names
    Given I compose `chronicled.orders` component
    And the chronicles scribe is running
    When I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 120
        email: bob@example.com
      """
    Then the chronicles answer "SELECT label, component, entity, version, toString(payload.total) AS total, toString(payload.email) AS email FROM events FINAL ORDER BY label" within 30 seconds:
      """yaml
      - label: chronicled.orders.created
        component: chronicled.orders
        entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        version: 1
        total: '120'
        email: bob@example.com
      - label: chronicled.orders.snapshot
        component: chronicled.orders
        entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        version: 1
        total: '120'
        email: ''
      """

  Scenario: The latest payload of each record under each label
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
    Then the chronicles answer "SELECT version, toString(payload.total) AS total FROM states FINAL WHERE label = 'chronicled.orders.snapshot'" within 30 seconds:
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
      """
    And I compose `chronicled.facts` component
    And the chronicles scribe is running
    When I call `chronicled.facts.search` with:
      """yaml
      input:
        query: teapot
      """
    Then the chronicles answer "SELECT label, isNull(entity) AS unentitled, toString(payload.query) AS query FROM events" within 30 seconds:
      """yaml
      - label: chronicled.facts.searched
        unentitled: 1
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
    Then the chronicles answer "SELECT label FROM events FINAL ORDER BY label" within 30 seconds:
      """yaml
      - label: chronicled.orders.created
      - label: chronicled.orders.snapshot
      """
