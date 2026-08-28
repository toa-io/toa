Feature: Mono deployment

  Scenario: Show `toa deploy` help
    When I run `toa deploy --help`
    Then program should exit
    And stdout should contain lines:
      """
      --mono
      """

  Scenario: Mono image does not include the context file
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa export images ./images --mono`
    Then program should exit with code 0
    And I run `find images -name context.toa.yaml`
    Then stdout should be empty

  Scenario: Deploy as a single image
    Given I have a component `dummies.one`
    And I have a context
    When I export a mono deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      name: mono
      replicas: 2
      /mono:
      """
    And stdout should not contain lines:
      """
      composition-dummies-one
      extension-exposition-gateway
      """

  Scenario: Apply mono replicas and resources
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      mono:
        replicas: 1
        resources:
          cpu: [50m, 500m]
          memory: [128Mi, 512Mi]
      """
    When I export a mono deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      replicas: 1
      """
    And mono Deployment container spec should contain:
      """
      resources:
        requests:
          cpu: 50m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi
      """

  Scenario: Expose the mono deployment
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          foo: api.foo.dev
        /:
          GET:
            dev:stub: ok!
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export a mono deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And stdout should not contain lines:
      """
      extension-exposition-gateway
      """
    And mono Ingress rules spec should contain:
      """
      - host: api.foo.dev
      """
    And mono Deployment container spec should contain:
      """
      startupProbe:
        httpGet:
          path: /.ready
          port: 8000
      """

  Scenario: Every service keeps its own path and port in mono
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      exposition:
        authorities:
          foo: api.foo.dev
        /:
          GET:
            dev:stub: ok!
      configuration:
        identity.tokens:
          key0: secret.key
      ingress:
        hosts:
          - api.foo.dev
      """
    When I export a mono deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And mono Ingress rules spec should contain:
      """
      - host: api.foo.dev
        http:
          paths:
            - path: /.introspection
              pathType: Prefix
              backend:
                service:
                  name: mono
                  port:
                    number: 8002
            - path: /
              pathType: Prefix
              backend:
                service:
                  name: mono
                  port:
                    number: 8000
      """
    And mono Service ports spec should contain:
      """
      - name: port-8002
        protocol: TCP
        port: 8002
        targetPort: 8002
      - name: port-8000
        protocol: TCP
        port: 8000
        targetPort: 8000
      """

  Scenario: Include pointer variables of extension components
    Given I have components:
      | exposed.one |
      | realtime.streamer |
    And I have a context with:
      """yaml
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export a mono deployment
    Then exported values should contain:
      """yaml
      mono:
        variables:
          - name: TOA_STASH_REALTIME_STREAMS
            value: redis://localhost
          - name: TOA_STASH_IDENTITY_OTP
            value: redis://localhost
          - name: TOA_MONGODB_IDENTITY_TOKENS
            value: mongodb://localhost
      """
