Feature: Resource management

  Scenario: Deploy Exposition with resource constraints
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          foo: api.foo.dev
        resources:
          cpu: [100m, 1]
          memory: [100Mi, 1Gi]
        /:
          GET:
            dev:stub: ok!
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And extension-exposition-gateway Deployment container spec should contain:
      """
      resources:
        requests:
          cpu: 100m
          memory: 100Mi
        limits:
          cpu: 1
          memory: 1Gi
      """

  Scenario: Deploy Realtime with resource constraints
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      realtime:
        resources:
          cpu: [100m, 200m]
          memory: [100Mi, 1Gi]
      """
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And extension-realtime-streams Deployment container spec should contain:
      """
      resources:
        requests:
          cpu: 100m
          memory: 100Mi
        limits:
          cpu: 200m
          memory: 1Gi
      """
