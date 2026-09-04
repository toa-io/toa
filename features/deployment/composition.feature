Feature: Export Compositions Deployment

  Scenario: Two components without explicit compositions
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I export deployment
    Then exported values should contain:
    """yaml
    compositions:
      - name: dummies-one
        components:
          - dummies-one
      - name: dummies-two
        components:
          - dummies-two
    """

  Scenario: A composition that runs a service
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - exposed.one
          services:
            - exposition
      """
    When I export deployment
    Then exported values should contain:
    """yaml
    compositions:
      - name: edge
        components:
          - exposed-one
        services:
          - '@toa.io/extensions.exposition'
        hosted:
          - exposition-gateway
        backends:
          - port: 8000
            path: /
    """

  Scenario: The service it runs is not deployed on its own
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - exposed.one
          services:
            - exposition
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      name: composition-edge
      name: extension-exposition-gateway
      """
    And composition-edge Deployment template.metadata spec should contain:
      """
      labels:
        toa/service-exposition-gateway: "1"
      """
    And stdout should not contain lines:
      """
      toa/service: extension-exposition-gateway
      """

  Scenario: A service no composition runs is deployed on its own
    Given I have a component `exposed.one`
    And I have a context
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      toa/service: extension-exposition-gateway
      """

  Scenario: Two compositions running one service

  A service is stateless and already runs several replicas. Two compositions running one are
  replicas of it: one Service selects the pods of both, and there is still one Ingress.

    Given I have components:
      | exposed.one |
      | dummies.one |
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - exposed.one
          services:
            - exposition
        - name: inner
          components:
            - dummies.one
          services:
            - exposition
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And composition-edge Deployment template.metadata spec should contain:
      """
      labels:
        toa/service-exposition-gateway: "1"
      """
    And composition-inner Deployment template.metadata spec should contain:
      """
      labels:
        toa/service-exposition-gateway: "1"
      """
    And extension-exposition-gateway Service spec spec should contain:
      """
      selector:
        toa/service-exposition-gateway: "1"
      """
    And stdout should not contain lines:
      """
      toa/service: extension-exposition-gateway
      """

  Scenario: A service of an extension no component references

  Listing it is what pulls the extension in, and its own components with it.

    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - dummies.one
          services:
            - realtime
      """
    When I export deployment
    Then exported values should contain:
    """yaml
    compositions:
      - name: edge
        hosted:
          - realtime-streams
    """
    And I run `helm template deployment`
    Then program should exit
    And stdout should not contain lines:
      """
      toa/service: extension-realtime-streams
      """

  Scenario: An unknown component
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - dummies.three
      """
    Then exporting deployment fails with:
      """
      Composition 'edge' lists an unknown component 'dummies.three'.
      """

  Scenario: An extension that runs no service
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      compositions:
        - name: edge
          components:
            - dummies.one
          services:
            - telemetry
      """
    Then exporting deployment fails with:
      """
      Composition 'edge' lists '@toa.io/extensions.telemetry', which contributes no service.
      """
