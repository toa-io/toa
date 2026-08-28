Feature: Resource management

  A deployment states what it may take. One that states nothing is `BestEffort`: first
  evicted, last scheduled CPU, and slow enough under contention to fail its own startup
  probe. Deploying without any is allowed, but it has to be said.

  Scenario: A composition that states nothing is refused
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      compositions:
        - name: one
          components:
            - exposed.one
      """
    And the context has no `resources` annotation
    Then exporting deployment fails with:
      """
      Composition 'one' declares no resources. Declare them on it or as the context's 'resources', or 'resources: null' to deploy it without any.
      """

  Scenario: A service that states nothing is refused
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      compositions:
        - name: one
          resources:
            cpu: [100m, 1]
            memory: [100Mi, 1Gi]
          components:
            - exposed.one
      """
    And the context has no `resources` annotation
    Then exporting deployment fails with:
      """
      Service 'introspection-explorer' declares no resources. Declare them on it or as the context's 'resources', or 'resources: null' to deploy it without any.
      """

  Scenario: The context states what a deployment does not
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      resources:
        cpu: [100m, 1]
        memory: [100Mi, 1Gi]
      compositions:
        - name: one
          components:
            - exposed.one
      """
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And composition-one Deployment container spec should contain:
      """
      resources:
        requests:
          cpu: 100m
          memory: 100Mi
        limits:
          cpu: 1
          memory: 1Gi
      """

  Scenario: Deploying without any is said out loud, over a context that states some
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      resources:
        cpu: [100m, 1]
        memory: [100Mi, 1Gi]
      compositions:
        - name: one
          resources: null
          components:
            - exposed.one
      """
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And composition-one Deployment container spec should not contain:
      """
      resources:
      """

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

  Scenario: Deploy Composition with resource constraints
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      compositions:
        - name: one
          resources:
            cpu: [100m, 1]
            memory: [100Mi, 1Gi]
          components:
            - exposed.one
      """
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And composition-one Deployment container spec should contain:
      """
      resources:
        requests:
          cpu: 100m
          memory: 100Mi
        limits:
          cpu: 1
          memory: 1Gi
      """
