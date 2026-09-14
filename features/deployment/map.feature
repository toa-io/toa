@deployment
Feature: Export the component map

  Which version of a component a process asks what that component provides. Mounted rather than
  rendered into a workload's environment: a variable would replace every pod of the context on
  every deployment, and a pod that came up between two of them could not be told.

  Scenario: The map is exported with the versions of every component
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      map:
        directory: /etc/toa
        file: components.json
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
