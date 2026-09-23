@deployment
Feature: Export the component map

  What every component of the context provides, by the version this deployment runs of it.
  Mounted rather than rendered into a workload's environment: a variable would replace every pod
  of the context on every deployment, and a pod that came up between two of them could not be
  told.

  Scenario: The map is exported gzipped, with the contract of every component
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      map:
        directory: /etc/toa
        file: .map.json.gz
      """
    And the exported map states:
      """yaml
      dummies.one:
        operations:
          transit:
            type: transition
            scope: object
      dummies.two:
        operations:
          transit:
            type: transition
      """

  @helm
  Scenario: The ConfigMap carries it as bytes
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      kind: ConfigMap
      """
    And stdout should contain lines:
      """
      binaryData:
      """
    And the rendered component map states:
      """yaml
      dummies.one:
        operations:
          transit:
            type: transition
      """

  @helm
  Scenario: Every workload mounts it
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      kind: ConfigMap
      name: components
      """
    And composition-exposed-one Deployment template.spec spec should contain:
      """
      volumes:
        - name: components
          configMap:
            name: components
      """
    And extension-exposition-gateway Deployment template.spec spec should contain:
      """
      volumes:
        - name: components
          configMap:
            name: components
      """
