Feature: Introspection deployment

  The extension is predefined, so the explorer and its components are deployed
  unless the context turns introspection off.

  Background:
    Given I have a component `mongo.one`

  Scenario: The explorer image is built
    Given I have a context
    When I export images
    Then the file ./images/extension-introspection-explorer.*/Dockerfile contains exact line 'CMD toa serve .'

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
            value: mongodb://localhost
          - name: TOA_MONGODB_INTROSPECTION_EDGES
            value: mongodb://localhost
      """

  Scenario: Collection is configured globally
    Given I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - variables:
          - name: TOA_INTROSPECTION
            value: eyJzYW1wbGVzIjpmYWxzZSwiaW50ZXJ2YWwiOjE1LCJ0aHJlc2hvbGQiOjI1Nn0=
      """

  Scenario: Enabling samples
    Given I have a context with:
      """yaml
      introspection:
        samples: true
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - variables:
          - name: TOA_INTROSPECTION
            value: eyJzYW1wbGVzIjp0cnVlLCJpbnRlcnZhbCI6MTUsInRocmVzaG9sZCI6MjU2fQ==
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
