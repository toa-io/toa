Feature: Chronicles

  A component's changes, as the events it declares render them, and the facts it sends are rows of
  the log, which the scribe consumes and writes. What is written of each is what its declaration
  says, and every declared label is a view of the log in the declared types.

  Background:
    Given the chronicles are empty
    And the `chronicled.orders` database is empty
    And the chronicles of `chronicled.orders` are deployed

  Scenario: A change is a row under each event the component declares, and its state is kept
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
    Then the chronicles answer "SELECT label, component, entity, version, identity, toString(payload.total) AS total FROM events FINAL" within 30 seconds:
      """yaml
      - label: chronicled.orders.created
        component: chronicled.orders
        entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        version: 1
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        total: '120'
      """
    And the chronicles answer "SELECT component, entity, version, identity, toString(payload.total) AS total FROM states FINAL" within 30 seconds:
      """yaml
      - component: chronicled.orders
        entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        version: 1
        identity: 9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c
        total: '120'
      """

  Scenario: What a payload holds beyond its declaration is not written, at any depth
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
        shipping:
          country: DE
          phone: '+49 30 1234567'
        items:
          - sku: T-1
            quantity: 2
            note: a gift
      """
    Then the chronicles answer "SELECT arraySort(JSONAllPaths(payload)) AS paths FROM events FINAL" within 30 seconds:
      """yaml
      - paths: [items, shipping.country, total]
      """
    And the chronicles answer "SELECT toJSONString(payload.items) AS items FROM events FINAL":
      """yaml
      - items: '[{"quantity":2,"sku":"T-1"}]'
      """
    And the chronicles answer "SELECT arraySort(JSONAllPaths(payload)) AS paths FROM states FINAL" within 30 seconds:
      """yaml
      - paths: [total]
      """

  Scenario: A declared label is a view in the declared types
    Given I compose `chronicled.orders` component
    And the chronicles scribe is running
    When I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 120
        shipping:
          country: DE
        items:
          - sku: T-1
            quantity: 2
          - sku: T-2
            quantity: 1
      """
    Then the chronicles answer "SELECT entity, total, toTypeName(total) AS type, shipping.country AS country FROM chronicled_orders_created" within 30 seconds:
      """yaml
      - entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        total: 120
        type: Nullable(Int64)
        country: DE
      """
    And the chronicles answer "SELECT item.sku AS sku, sum(item.quantity) AS units FROM chronicled_orders_created ARRAY JOIN items AS item GROUP BY sku ORDER BY sku":
      """yaml
      - sku: T-1
        units: 2
      - sku: T-2
        units: 1
      """
    And the chronicles answer "SELECT entity, version, total FROM chronicled_orders" within 30 seconds:
      """yaml
      - entity: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        version: 1
        total: 120
      """

  Scenario: A view of a label no longer declared is gone once the scribe starts
    Given the chronicles of `chronicled.facts` are deployed
    And the chronicles scribe is running
    And the chronicles answer "SELECT name FROM system.tables WHERE database = 'chronicles' AND startsWith(name, 'chronicled_') ORDER BY name":
      """yaml
      - name: chronicled_facts_searched
      """
    When the chronicles scribe stops
    And the chronicles of `chronicled.orders` are deployed
    And I compose `chronicled.orders` component
    And the chronicles scribe is running
    Then the chronicles answer "SELECT name FROM system.tables WHERE database = 'chronicles' AND startsWith(name, 'chronicled_') ORDER BY name":
      """yaml
      - name: chronicled_orders
      - name: chronicled_orders_created
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
    Given the chronicles of `chronicled.facts` are deployed
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

  Scenario: A fact the component does not declare is refused where it is sent
    Given the chronicles of `chronicled.facts` are deployed
    And I compose `chronicled.facts` component
    When I call `chronicled.facts.whisper` with:
      """yaml
      input:
        query: teapot
      """
    Then the following exception is thrown:
      """yaml
      code: 600
      message: "MisuseException: 'chronicled.facts' declares no fact 'whispered'"
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
    Given the chronicles of components are deployed:
      | chronicled.orders    |
      | chronicled.stateless |
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
    And the chronicles answer "SELECT component FROM states FINAL" within 30 seconds:
      """yaml
      - component: chronicled.orders
      """

  Scenario: A payload of another type than declared is refused and holds up nothing
    Given the chronicles of components are deployed:
      | chronicled.orders   |
      | chronicled.mistyped |
    And the `chronicled.mistyped` database is empty
    And I compose components:
      | chronicled.orders   |
      | chronicled.mistyped |
    And the chronicles scribe is running
    When I call `chronicled.mistyped.transit` with:
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
