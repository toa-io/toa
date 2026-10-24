Feature: Reading the log

  Background:
    Given the chronicles are empty
    And the chronicles scribe is running
    And I call `chronicles.ingestion.anonymous` with:
      """yaml
      input:
        events:
          - id: q1
            name: page.viewed
            time: 1761200000000
            payload:
              path: /pricing
          - id: q2
            name: page.viewed
            time: 1761200001000
            payload:
              path: /about
      """
    And the chronicles answer "SELECT count() AS n FROM events" within 30 seconds:
      """yaml
      - n: 2
      """

  Scenario: A query
    When I call `chronicles.queries.query` with:
      """yaml
      input:
        sql: SELECT label, count() AS n FROM events FINAL GROUP BY label;
      """
    Then the reply is received:
      """yaml
      columns:
        - name: label
        - name: n
      rows:
        - [client.page.viewed, 2]
      truncated: false
      """

  Scenario: What the log holds
    When I call `chronicles.queries.describe`
    Then the reply is received:
      """yaml
      dialect: ClickHouse SQL; read `events` and `states` with FINAL
      labels:
        - label: client.page.viewed
          rows: 2
          paths: [path]
      states: []
      views: []
      """

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
        sql: SELECT toString(payload.path) AS path FROM events FINAL
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
      """

  Scenario: A materialized view
    When I call `chronicles.queries.define` with:
      """yaml
      input:
        name: daily
        sql: SELECT toDate(time) AS day, count() AS n FROM events FINAL GROUP BY day
        refresh: 3600
      """
    Then the chronicles answer "SELECT toString(day) AS day, n FROM daily" within 30 seconds:
      """yaml
      - day: '2025-10-23'
        n: 2
      """
    When I call `chronicles.queries.describe`
    Then the reply is received:
      """yaml
      views:
        - name: daily
          refresh: 3600
      """

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
