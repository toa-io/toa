@deployment
Feature: Chronicles deployment

  The events the components declare are consumed, so they are published; the service that keeps the
  log consumes them, over the brokers the context's `amqp` names, and is the only process given
  the store.

  Scenario: Deploying a context that keeps chronicles
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://analytics.example.com
        store:
          provider: clickhouse
          url: https://ch.example.com:8443
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
        - name: chronicles-relay
          components:
            - chronicles-queries
            - chronicles-relay
          variables:
            - name: TOA_CHRONICLES
              value: '{"broker":"amqp://analytics.example.com","store":{"provider":"clickhouse","url":"https://ch.example.com:8443"},"retention":730,"encounters":false,"ip":"truncated","events":{"chronicled.orders.created":{"description":"An order was placed","properties":{"total":{"type":"integer","description":"The amount of the order, in cents"},"shipping":{"type":"object","description":"Where the order goes","properties":{"country":{"type":"string","description":"ISO 3166 alpha-2 code of the country"}}},"items":{"type":"array","description":"What was ordered","items":{"type":"object","properties":{"sku":{"type":"string","description":"The code of the product"},"quantity":{"type":"integer","description":"Units of the product"}}}}}}},"states":{"chronicled.orders.snapshot":{"description":"An order as it stands","properties":{"total":{"type":"integer","description":"The amount of the order, in cents"}}}},"facts":{},"identities":{"chronicled.orders":"customer"},"timestamps":{"chronicled.orders":"UPDATED"}}'
            - name: TOA_CHRONICLES_BROKER_USERNAME
              secret:
                name: toa-chronicles
                key: broker_username
            - name: TOA_CHRONICLES_BROKER_PASSWORD
              secret:
                name: toa-chronicles
                key: broker_password
            - name: TOA_CHRONICLES_STORE_USERNAME
              secret:
                name: toa-chronicles
                key: store_username
            - name: TOA_CHRONICLES_STORE_PASSWORD
              secret:
                name: toa-chronicles
                key: store_password
      """
    And exported values should not contain:
      """yaml
      compositions:
        - name: chronicled-orders
          variables:
            - name: TOA_CHRONICLES_STORE_PASSWORD
            - name: TOA_CHRONICLES_BROKER_PASSWORD
      """

  Scenario: Serving the routes of encounters
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://analytics.example.com
        store:
          provider: clickhouse
          url: https://ch.example.com:8443
        encounters: true
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-relay
          components:
            - chronicles-encounters
            - chronicles-queries
            - chronicles-relay
      """

  Scenario: A context that writes the log and does not read it
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://analytics.example.com
        encounters: true
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-relay
          components:
            - chronicles-encounters
            - chronicles-relay
          variables:
            - name: TOA_CHRONICLES
            - name: TOA_CHRONICLES_BROKER_USERNAME
              secret:
                name: toa-chronicles
                key: broker_username
            - name: TOA_CHRONICLES_BROKER_PASSWORD
              secret:
                name: toa-chronicles
                key: broker_password
      """
    And exported values should not contain:
      """yaml
      services:
        - name: chronicles-relay
          components:
            - chronicles-queries
      """
    And exported values should not contain:
      """yaml
      services:
        - name: chronicles-relay
          variables:
            - name: TOA_CHRONICLES_STORE_USERNAME
      """
    And exported values should not contain:
      """yaml
      services:
        - name: chronicles-relay
          variables:
            - name: TOA_CHRONICLES_STORE_PASSWORD
      """

  Scenario: What the service may take
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://analytics.example.com
        store:
          provider: clickhouse
          url: https://ch.example.com:8443
        resources:
          cpu: [100m, 500m]
          memory: [200Mi, 400Mi]
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-relay
          resources:
            cpu: [100m, 500m]
            memory: [200Mi, 400Mi]
      """

  Scenario: The service without a component that declares chronicles
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://analytics.example.com
        store:
          provider: clickhouse
          url: https://ch.example.com:8443
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: chronicles-relay
      """

  Scenario: No annotation, no service
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment
    Then exported values should not contain:
      """yaml
      services:
        - name: chronicles-relay
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
        broker: amqp://analytics.example.com
        store:
          provider: clickhouse
          url: https://ch.example.com:8443
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
        broker: amqp://analytics.example.com
        store:
          provider: bigquery
          url: https://bigquery.example.com/shop
      """
    Then exporting deployment fails with:
      """
      Invalid chronicles annotation: must be equal to constant
      """

  Scenario: An address that names a database
    Given I have a component `chronicled.orders`
    And I have a context with:
      """yaml
      chronicles:
        broker: amqp://analytics.example.com
        store:
          provider: clickhouse
          url: https://ch.example.com:8443/shop
      """
    Then exporting deployment fails with:
      """
      The store of chronicles is the address of a server: what is read is its user's.
      """
