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
    And the chronicles relay is running
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
    And the chronicles relay is running
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

  Scenario: Every row is of the scope of its context
    Given I compose `chronicled.orders` component
    And the chronicles relay is running
    When I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 120
      """
    Then the chronicles answer "SELECT scope, label FROM events FINAL" within 30 seconds:
      """yaml
      - scope: toa-dev
        label: chronicled.orders.created
      """
    And the chronicles answer "SELECT scope, component FROM states FINAL" within 30 seconds:
      """yaml
      - scope: toa-dev
        component: chronicled.orders
      """

  Scenario: A declared field is read in its type as describe says
    Given I compose `chronicled.orders` component
    And the chronicles relay is running
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
    Then the chronicles answer "SELECT JSONExtract(ifNull(toJSONString(payload.`total`), 'null'), 'Nullable(Int64)') AS total, toTypeName(total) AS type, JSONExtract(toJSONString(payload.^`shipping`), 'Tuple(country Nullable(String))').country AS country FROM events FINAL" within 30 seconds:
      """yaml
      - total: 120
        type: Nullable(Int64)
        country: DE
      """

  Scenario: The state of an entity is its latest version
    Given I compose `chronicled.orders` component
    And the chronicles relay is running
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
    And the chronicles relay is running
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

  Scenario: What is committed while the relay is away is written once it is back
    Given I compose `chronicled.orders` component
    And the chronicles relay is running
    When the chronicles relay stops
    And I call `chronicled.orders.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 7
      """
    And I wait 2 seconds
    And the chronicles relay is running
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
    And the chronicles relay is running
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
    And the chronicles relay is running
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

  Scenario: A change is when it was made, however late the relay takes it
    Given the chronicles of `chronicled.stamped` are deployed
    And the `chronicled.stamped` database is empty
    And I compose `chronicled.stamped` component
    And the chronicles relay is running
    When the chronicles relay stops
    And I call `chronicled.stamped.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        total: 3
      """
    And I wait 3 seconds
    And the chronicles relay is running
    Then the chronicles answer "SELECT abs(toUnixTimestamp64Milli(time) - payload.rendered::Int64) < 1000 AS made FROM events FINAL WHERE label = 'chronicled.stamped.placed'" within 30 seconds:
      """yaml
      - made: 1
      """

