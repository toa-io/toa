@deployment
Feature: Chronicles deployment

  The events the components name are consumed, so they are published; the service that keeps the
  log consumes them, over the brokers the context's `amqp` names, and is the only process given
  the store.

  Scenario: Deploying a context that keeps chronicles
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        store:
          provider: clickhouse
          url: https://ch.example.com:8443/shop
        retention: 730
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: chronicled-orders
          variables:
            - name: TOA_EVENTS_CHRONICLED_ORDERS
              value: snapshot created
      services:
        - name: chronicles-scribe
          components:
            - chronicles-facts
            - chronicles-queries
          variables:
            - name: TOA_CHRONICLES
              value: '{"store":{"provider":"clickhouse","url":"https://ch.example.com:8443/shop"},"retention":730,"ingest":false,"events":["chronicled.orders.created"],"states":["chronicled.orders.snapshot"]}'
            - name: TOA_CHRONICLES_STORE_USERNAME
              secret:
                name: toa-chronicles-store
                key: username
            - name: TOA_CHRONICLES_STORE_PASSWORD
              secret:
                name: toa-chronicles-store
                key: password
            - name: TOA_CHRONICLES_STORE_READER
              secret:
                name: toa-chronicles-store
                key: reader
      """
    And exported values should not contain:
      """yaml
      compositions:
        - name: chronicled-orders
          variables:
            - name: TOA_CHRONICLES_STORE_PASSWORD
      """

  Scenario: Serving the client route
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        store:
          provider: clickhouse
          url: https://ch.example.com:8443/shop
        ingest: true
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-scribe
          components:
            - chronicles-facts
            - chronicles-ingestion
            - chronicles-queries
      """

  Scenario: The service without a component that declares chronicles
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      chronicles:
        store:
          provider: clickhouse
          url: https://ch.example.com:8443/shop
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
        store:
          provider: clickhouse
          url: https://ch.example.com:8443/shop
      """
    Then exporting deployment fails with:
      """
      Chronicles of 'chronicled.misdeclared' name 'shipped', which is not an event of the component.
      """

  Scenario: A store Toa does not provide
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        store:
          provider: bigquery
          url: https://bigquery.example.com/shop
      """
    Then exporting deployment fails with:
      """
      Invalid chronicles annotation: must be equal to constant
      """

  Scenario: A database the address does not name
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        store:
          provider: clickhouse
          url: https://ch.example.com:8443
      """
    Then exporting deployment fails with:
      """
      The store of chronicles names no database: the path of its address is the database.
      """
