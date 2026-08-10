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
        periodSeconds: 10
        timeoutSeconds: 3
        failureThreshold: 3
      """
