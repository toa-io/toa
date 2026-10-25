Feature: Reading the log

  Background:
    Given the chronicles are empty
    And the chronicles of `chronicled.orders` are deployed
    And I compose `chronicled.orders` component
    And the encounters are documented:
      """yaml
      page_viewed:
        description: A page was shown
        fields:
          path: The URL path, without the query
      """
    And the chronicles scribe is running
    And I call `chronicles.encounters.anonymous` with:
      """yaml
      input:
        sent: 1761200001000
        events:
          - id: q1
            name: page_viewed
            time: 1761200000000
            payload:
              path: /pricing
          - id: q2
            name: page_viewed
            time: 1761200001000
            payload:
              path: /about
              utm: 7
      """
    And the chronicles answer "SELECT count() AS n FROM encounters" within 30 seconds:
      """yaml
      - n: 2
      """

  Scenario: A query
    When I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT name, count() AS n FROM encounters FINAL GROUP BY name;
      """
    Then the reply is received:
      """yaml
      columns:
        - name: name
        - name: n
      rows:
        - [page_viewed, 2]
      truncated: false
      """

  Scenario: What the log holds
    When I call `chronicles.queries.describe`
    Then the reply is received:
      """yaml
      labels:
        - label: chronicled.orders.created
          description: An order was placed
          view: chronicled_orders_created
          rows: 0
          fields:
            - path: total
              type: Int64
              description: The amount of the order, in cents
            - path: shipping
              type: Tuple(country String)
              description: Where the order goes
            - path: shipping.country
              type: String
              description: ISO 3166 alpha-2 code of the country
            - path: items
              type: Array(Tuple(sku String, quantity Int64))
              description: What was ordered
            - path: items.sku
              type: String
              description: The code of the product
            - path: items.quantity
              type: Int64
              description: Units of the product
      states:
        - component: chronicled.orders
          description: An order as it stands
          view: chronicled_orders
          entities: 0
          fields:
            - path: total
              type: Int64
              description: The amount of the order, in cents
      encounters:
        - name: page_viewed
          description: A page was shown
          rows: 2
          fields:
            - path: path
              types: [String]
              description: The URL path, without the query
            - path: utm
              types: [Int64]
      views: []
      """

  Scenario: How to read the log, and how its store is read
    When I call `chronicles.queries.describe`
    Then the reply's `guide` mentions "A visitor is not a person"
    And the reply's `guide` mentions "FINAL"

  Scenario: When the log was last written
    When I call `chronicles.queries.describe`
    Then the reply's `encounters[0].first` is a time within the last minute
    And the reply's `encounters[0].last` is a time within the last minute
    And the reply's `encounters[0].received` is a time within the last minute

  Scenario Outline: A query that is refused
    When I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: <sql>
      """
    Then the error is received:
      """yaml
      code: REFUSED
      """

    Examples:
      | sql                                                    |
      | INSERT INTO events (id) VALUES ('x')                   |
      | SELECT 1 SETTINGS max_execution_time = 1000            |
      | SELECT name FROM system.users                          |
      | DROP TABLE events                                      |
      | SELECT 1; SELECT 2                                     |
      | SELECT nonsense FROM                                   |

  Scenario: A view, read by a query
    When I call `chronicles.queries.define` with:
      """yaml
      input:
        name: paths
        title: Paths viewed
        description: Every path a page was viewed at, a row each
        sql: SELECT toString(payload.path) AS path FROM encounters FINAL
      """
    And I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT path FROM paths ORDER BY path
      """
    Then the reply is received:
      """yaml
      rows:
        - [/about]
        - [/pricing]
      """
    When I call `chronicles.queries.describe`
    Then the reply is received:
      """yaml
      views:
        - name: paths
          title: Paths viewed
          description: Every path a page was viewed at, a row each
      """

  Scenario: A materialized view
    When I call `chronicles.queries.define` with:
      """yaml
      input:
        name: daily
        sql: SELECT toDate(time) AS day, count() AS n FROM encounters FINAL GROUP BY day
        refresh: 3600
      """
    Then the chronicles answer "SELECT day = toDate(now64(3)) AS today, n FROM daily" within 30 seconds:
      """yaml
      - today: 1
        n: 2
      """
    When I call `chronicles.queries.describe`
    Then the reply is received:
      """yaml
      views:
        - name: daily
          refresh: 3600
      """
    And the reply's `views[0].refreshed` is a time within the last minute

  Scenario: A view is replaced and dropped
    When I call `chronicles.queries.define` with:
      """yaml
      input:
        name: paths
        sql: SELECT 1 AS one
      """
    And I call `chronicles.queries.define` with:
      """yaml
      input:
        name: paths
        sql: SELECT 2 AS two
      """
    And I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT * FROM paths
      """
    Then the reply is received:
      """yaml
      rows:
        - [2]
      """
    When I call `chronicles.queries.drop` with:
      """yaml
      input:
        name: paths
      """
    And I call `chronicles.queries.drop` with:
      """yaml
      input:
        name: paths
      """
    Then the error is received:
      """yaml
      code: NOT_FOUND
      """

  Scenario Outline: A view that is refused
    When I call `chronicles.queries.define` with:
      """yaml
      input:
        name: <name>
        sql: <sql>
      """
    Then the error is received:
      """yaml
      code: <code>
      """

    Examples:
      | name   | sql                             | code     |
      | users  | SELECT name FROM system.users   | REFUSED  |
      | writes | INSERT INTO events (id) VALUES ('x') | REFUSED  |
      | events | SELECT 1                        | RESERVED |
      | encounters | SELECT 1                    | RESERVED |
      | chronicled_orders_created | SELECT 1     | RESERVED |

  Scenario: A query past the rows answers what it has
    When I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT number FROM numbers(20000)
      """
    Then the reply is received:
      """yaml
      truncated: true
      """
    When I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT number FROM numbers(10000)
      """
    Then the reply is received:
      """yaml
      truncated: false
      """

  Scenario: What the store's administrator grants the reader survives a start
    Given the store runs:
      """
      DROP DATABASE IF EXISTS elsewhere SYNC;
      CREATE DATABASE elsewhere;
      CREATE TABLE elsewhere.numbers (n UInt8) ENGINE = Memory;
      INSERT INTO elsewhere.numbers VALUES (7);
      GRANT SELECT ON elsewhere.* TO `toa-dev_reader`
      """
    When the chronicles scribe stops
    And the chronicles scribe is running
    And I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT n FROM elsewhere.numbers
      """
    Then the reply is received:
      """yaml
      rows:
        - [7]
      """
    And the store runs:
      """
      DROP DATABASE elsewhere SYNC
      """

  Scenario: Another database is not the reader's unless it is granted
    Given the store runs:
      """
      DROP DATABASE IF EXISTS elsewhere SYNC;
      CREATE DATABASE elsewhere;
      CREATE TABLE elsewhere.numbers (n UInt8) ENGINE = Memory
      """
    When I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT n FROM elsewhere.numbers
      """
    Then the error is received:
      """yaml
      code: REFUSED
      """
    And the store runs:
      """
      DROP DATABASE elsewhere SYNC
      """

