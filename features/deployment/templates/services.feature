Feature: Service Deployment

  Scenario: Deploy a service with global variables
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          local: api.dev
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
      env:
        - name: TOA_AMQP_CONTEXT__USERNAME
          valueFrom:
            secretKeyRef:
              name: toa-amqp-context.default
              key: username
        - name: TOA_AMQP_CONTEXT__PASSWORD
          valueFrom:
            secretKeyRef:
              name: toa-amqp-context.default
              key: password
      """

  Scenario: Deploy a service with ingress
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          foo: api.foo.dev
          bar: api.bar.dev
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
    And extension-exposition-gateway Ingress rules spec should contain:
      """
      - host: api.foo.dev
      - host: api.bar.dev
      """

  Scenario: Deploy a service with probes
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          local: api.dev
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
      startupProbe:
        httpGet:
          path: /.ready
          port: 8000
        initialDelaySeconds: 3
        periodSeconds: 2
        timeoutSeconds: 3
        failureThreshold: 150
      readinessProbe:
        httpGet:
          path: /.ready
          port: 8000
        periodSeconds: 10
        timeoutSeconds: 3
        failureThreshold: 3
      """

  Scenario: Replicas are replaced in parallel
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          local: api.dev
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
    And extension-exposition-gateway Deployment strategy spec should contain:
      """
      type: RollingUpdate
      rollingUpdate:
        maxUnavailable: 50%
        maxSurge: 50%
      """

  Scenario: Deploy a service with connection draining
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          local: api.dev
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
      lifecycle:
        preStop:
          exec:
            command: [sleep, "5"]
      """
    And extension-exposition-gateway Deployment template.spec spec should contain:
      """
      terminationGracePeriodSeconds: 45
      """
