@deployment
Feature: Evicted components and services

  What a context evicts is not deployed, whatever else names it.

  Scenario: An evicted component is not deployed
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      evicted:
        components:
          - dummies.two
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      components: [dummies-one]
      """
    And exported values should not contain:
      """yaml
      components: [dummies-two]
      """

  Scenario: A composition carries the members that are not evicted
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - dummies.one
            - dummies.two
      evicted:
        components:
          - dummies.two
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: edge
          components: [dummies-one]
      """
    And exported values should not contain:
      """yaml
      compositions:
        - name: edge
          components: [dummies-two]
      """

  @helm
  Scenario: A composition every component of which is evicted is not deployed

  The service it listed falls back to a deployment of its own: listing it is what pulled the
  extension in, and nothing else runs it.

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - dummies.one
          services:
            - realtime
      evicted:
        components:
          - dummies.one
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      toa/service: extension-realtime-streams
      """
    And stdout should not contain lines:
      """
      name: composition-edge
      """

  @helm
  Scenario: A composition does not run an evicted service
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - dummies.one
          services:
            - realtime
      evicted:
        services:
          - realtime
      """
    When I export deployment
    Then exported values should not contain:
      """yaml
      compositions:
        - name: edge
          hosted: [realtime-streams]
      """
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      name: composition-edge
      """
    And stdout should not contain lines:
      """
      name: extension-realtime-streams
      """

  @helm
  Scenario: An evicted service an annotation alone would have deployed
    Given I have a component `mongo.one`
    And I have a context with:
      """yaml
      realtime:
        mongo.one.created: id
      evicted:
        services:
          - realtime
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should not contain lines:
      """
      name: extension-realtime-streams
      """

  Scenario: An evicted service is built into nothing
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      evicted:
        services:
          - exposition
      """
    When I export images
    Then there is no file ./images/extension-exposition-gateway.*/Dockerfile

  Scenario: An evicted component consumes nothing

  It is taken out before anything is derived from what is left, so a producer whose only
  receiver is evicted publishes nothing and writes no outbox.

    Given I have components:
      | mongo.outbox |
      | mongo.sink   |
    And I have a context with:
      """yaml
      evicted:
        components:
          - mongo.sink
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: mongo-outbox
          variables:
            - name: TOA_EVENTS_MONGO_OUTBOX
      """
    And exported values should not contain:
      """yaml
      compositions:
        - name: mongo-outbox
          variables:
            - name: TOA_EVENTS_MONGO_OUTBOX
              value: incremented sync
      """

  Scenario: Evicting a service nothing would have deployed changes nothing
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      evicted:
        services:
          - realtime
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      components: [dummies-one]
      """

  Scenario: Eviction is stated for an environment
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      evicted@production:
        components:
          - dummies.two
      """
    When I export deployment for production
    Then exported values should not contain:
      """yaml
      components: [dummies-two]
      """

  Scenario: And every other environment deploys it
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      evicted@production:
        components:
          - dummies.two
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      components: [dummies-one, dummies-two]
      """

  Scenario: Mono runs what is not evicted
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      evicted:
        components:
          - dummies.two
      """
    When I export a mono deployment
    Then exported values should contain:
      """yaml
      mono:
        components: [dummies-one]
      """
    And exported values should not contain:
      """yaml
      mono:
        components: [dummies-two]
      """

  Scenario: An unknown component
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      evicted:
        components:
          - dummies.three
      """
    Then exporting deployment fails with:
      """
      'evicted' names an unknown component 'dummies.three'.
      """
