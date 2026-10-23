@deployment
Feature: Chronicles deployment

  Every composition is given the broker it publishes to. The service that provisions ClickHouse
  and serves the log is given ClickHouse, and nothing else is.

  Scenario: Deploying a context that keeps chronicles
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://rabbitmq.example.com
        clickhouse: https://ch.example.com:8443/shop
        retention: 730
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: chronicled-orders
          variables:
            - name: TOA_CHRONICLES_BROKER
              value: amqp://rabbitmq.example.com
            - name: TOA_CHRONICLES_BROKER_USERNAME
              secret:
                name: toa-chronicles-broker
                key: username
            - name: TOA_CHRONICLES_BROKER_PASSWORD
              secret:
                name: toa-chronicles-broker
                key: password
      services:
        - name: chronicles-scribe
          components:
            - chronicles-query
          variables:
            - name: TOA_CHRONICLES
              value: '{"clickhouse":{"url":"https://ch.example.com:8443/shop","broker":"amqp://rabbitmq.example.com"},"retention":730,"ingest":false}'
            - name: TOA_CHRONICLES_CLICKHOUSE_USERNAME
              secret:
                name: toa-chronicles-clickhouse
                key: username
            - name: TOA_CHRONICLES_CLICKHOUSE_PASSWORD
              secret:
                name: toa-chronicles-clickhouse
                key: password
            - name: TOA_CHRONICLES_CLICKHOUSE_READER
              secret:
                name: toa-chronicles-clickhouse
                key: reader
            - name: TOA_CHRONICLES_BROKER
              value: amqp://rabbitmq.example.com
      """
    And exported values should not contain:
      """yaml
      compositions:
        - name: chronicled-orders
          variables:
            - name: TOA_CHRONICLES_CLICKHOUSE_PASSWORD
      """

  Scenario: ClickHouse reaching the broker at another address
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://localhost:5672
        clickhouse:
          url: http://localhost:8123/shop
          broker: amqp://rabbitmq:5672
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-scribe
          variables:
            - name: TOA_CHRONICLES
              value: '{"clickhouse":{"url":"http://localhost:8123/shop","broker":"amqp://rabbitmq:5672"},"ingest":false}'
      """

  Scenario: Serving the client route
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://rabbitmq.example.com
        clickhouse: https://ch.example.com:8443/shop
        ingest: true
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-scribe
          components:
            - chronicles-query
            - chronicles-ingest
      """

  Scenario: The service without a component that declares chronicles
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://rabbitmq.example.com
        clickhouse: https://ch.example.com:8443/shop
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-scribe
      """

  Scenario: No annotation, no service
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment
    Then exported values should not contain:
      """yaml
      services:
        - name: chronicles-scribe
      """

  Scenario: A component that declares chronicles in a context that keeps none
    Given I have a component `chronicled.orders`
    And I have a context
    Then exporting deployment fails with:
      """
      Chronicles are declared by 'chronicled.orders', and the context has no 'chronicles' annotation.
      """

  Scenario: A label that is not an event of the component
    Given I have a component `chronicled.misdeclared`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://rabbitmq.example.com
        clickhouse: https://ch.example.com:8443/shop
      """
    Then exporting deployment fails with:
      """
      Chronicles of 'chronicled.misdeclared' name 'shipped', which is not an event of the component.
      """

  Scenario: A sharded broker
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: [amqp://rabbitmq-0.example.com, amqp://rabbitmq-1.example.com]
        clickhouse: https://ch.example.com:8443/shop
      """
    Then exporting deployment fails with:
      """
      Chronicles are carried by one broker, and the annotation names 2.
      """

  Scenario: A database the address does not name
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://rabbitmq.example.com
        clickhouse: https://ch.example.com:8443
      """
    Then exporting deployment fails with:
      """
      The ClickHouse address of chronicles names no database: its path is the database.
      """
