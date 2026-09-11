@deployment @helm
Feature: Composition Deployment

  Scenario: Deploy a composition with probes
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And composition-dummies-one Deployment container spec should contain:
      """
      startupProbe:
        httpGet:
          path: /.ready
          port: 8001
        periodSeconds: 2
        timeoutSeconds: 3
        failureThreshold: 150
      readinessProbe:
        httpGet:
          path: /.ready
          port: 8001
        periodSeconds: 2
        timeoutSeconds: 3
        failureThreshold: 5
      """

  Scenario: A composition states how many replicas it runs
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      compositions:
        - name: one
          replicas: 1
          components:
            - dummies.one
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And composition-one Deployment spec spec should contain:
      """
      replicas: 1
      """
