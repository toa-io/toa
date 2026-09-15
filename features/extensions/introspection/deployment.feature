@deployment
Feature: Introspection deployment

  The extension is predefined, so the explorer and its components are deployed
  unless the context turns introspection off.

  Background:
    Given I have a component `mongo.one`

  Scenario: The explorer image is built
    Given I have a context
    When I export images
    Then the file ./images/extension-introspection-explorer.*/Dockerfile contains exact line 'CMD toa serve . --map /etc/toa/.map.json'

  Scenario: Deploying the explorer
    Given I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: introspection-explorer
          components:
            - introspection-nodes
            - introspection-edges
      """

  Scenario: Deploying database pointers of the explorer components
    Given I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: introspection-explorer
          variables:
          - name: TOA_MONGODB_INTROSPECTION_NODES
            value: mongodb://localhost:31020
          - name: TOA_MONGODB_INTROSPECTION_EDGES
            value: mongodb://localhost:31020
      """

  Scenario: Collection is configured globally
    Given I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - variables:
          - name: TOA_INTROSPECTION
            value: '{"interval":300,"threshold":1024,"ui":true,"halt":false,"duration":[30,3600],"quiescence":[30,1800]}'
      """

  Scenario: Deploying the signals component where halts are on
    Given I have a context with:
      """yaml
      introspection:
        halt: true
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: introspection-explorer
          components:
            - introspection-nodes
            - introspection-edges
            - introspection-signals
      """
    And exported values should contain:
      """yaml
      services:
        - name: introspection-explorer
          variables:
          - name: TOA_MONGODB_INTROSPECTION_SIGNALS
            value: mongodb://localhost:31020
      """

  Scenario: Leaving the signals component out where halts are off
    Given I have a context
    When I export deployment
    Then exported values should not contain:
      """yaml
      services:
        - name: introspection-explorer
          variables:
          - name: TOA_MONGODB_INTROSPECTION_SIGNALS
      """

  Scenario: Disabling introspection
    Given I have a context with:
      """yaml
      introspection: false
      """
    When I export deployment
    Then exported values should not contain:
      """yaml
      services:
        - name: introspection-explorer
      """

  Scenario: Introspection requires exposition
    Given I have a context
    And the context has no `exposition` annotation
    Then exporting deployment fails with:
      """
      Exposition context annotation is required
      """

  Scenario: An application without exposition turns introspection off
    Given I have a context with:
      """yaml
      introspection: false
      """
    And the context has no `exposition` annotation
    When I export deployment
    Then exported values should not contain:
      """yaml
      services:
        - name: introspection-explorer
      """

  Scenario: Publishing the UI
    Given I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: introspection-explorer
          port: 8002
          ingress:
            path: /.introspection
            hosts:
              - localhost
      """

  Scenario: Collecting the map without publishing the UI
    Given I have a context with:
      """yaml
      introspection:
        ui: false
      """
    When I export deployment
    Then exported values should not contain:
      """yaml
      services:
        - name: introspection-explorer
          ingress:
            path: /.introspection
      """

  Scenario: The UI has nowhere to be published
    Given I have a context
    And the context has no `ingress` annotation
    Then exporting deployment fails with:
      """
      Service 'introspection-explorer' declares an ingress, but no hosts are defined. Declare them in the context's 'ingress' section.
      """
