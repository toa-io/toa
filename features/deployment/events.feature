Feature: Events deployment

  A component is told which of its events something consumes. What nothing consumes is not
  published, and a component none of whose events are consumed writes no outbox.

  Scenario: A receiver makes an event consumed
    Given I have components:
      | mongo.outbox |
      | mongo.sink   |
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: mongo-outbox
          variables:
            - name: TOA_EVENTS_MONGO_OUTBOX
              value: incremented sync
      """

  Scenario: Nothing consumes the events of a component
    Given I have a component `mongo.one`
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: mongo-one
          variables:
            - name: TOA_EVENTS_MONGO_ONE
      """

  Scenario: A receiver with a source consumes from another context
    Given I have a component `external.consumer`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://localhost
        sources:
          external: amqp://external.example.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: external-consumer
          variables:
            - name: TOA_EVENTS_EXTERNAL_CONSUMER
      """

  Scenario: A realtime route makes an event consumed
    Given I have a component `mongo.one`
    And I have a context with:
      """yaml
      realtime:
        mongo.one.created: id
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: mongo-one
          variables:
            - name: TOA_EVENTS_MONGO_ONE
              value: created
      """

  Scenario: A composition carries the variable, empty one included
    # `{{- if .value }}` drops the `value` key for an empty string, and Kubernetes reads such
    # an entry as `""` — which is what says nothing is consumed
    Given I have components:
      | mongo.outbox |
      | mongo.sink   |
    And I have a context
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And composition-mongo-outbox Deployment container spec should contain:
      """yaml
      env:
        - name: TOA_EVENTS_MONGO_OUTBOX
          value: incremented sync
      """
    And composition-mongo-sink Deployment container spec should contain:
      """yaml
      env:
        - name: TOA_EVENTS_MONGO_SINK
      """

  Scenario: A mono deployment carries the variables of every component
    Given I have components:
      | mongo.outbox |
      | mongo.sink   |
    And I have a context
    When I export a mono deployment
    And I run `helm template deployment`
    Then program should exit
    And mono Deployment container spec should contain:
      """yaml
      env:
        - name: TOA_EVENTS_MONGO_OUTBOX
          value: incremented sync
      """
    And mono Deployment container spec should contain:
      """yaml
      env:
        - name: TOA_EVENTS_MONGO_SINK
      """

  Scenario: The components an extension brings are counted too
    # `identity.tokens` receives `identity.bans.created` and `identity.bans.updated`, and both
    # components come with exposition rather than from the context
    Given I have a component `exposed.one`
    And I have a context
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And extension-exposition-gateway Deployment container spec should contain:
      """yaml
      env:
        - name: TOA_EVENTS_IDENTITY_BANS
          value: created updated
      """

  Scenario: The context declares what is consumed outside it
    Given I have a component `mongo.one`
    And I have a context with:
      """yaml
      events:
        - mongo.one.deleted
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: mongo-one
          variables:
            - name: TOA_EVENTS_MONGO_ONE
              value: deleted
      """
