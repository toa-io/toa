Feature: Mono deployment

  Scenario: Show `toa deploy` help
    When I run `toa deploy --help`
    Then program should exit
    And stdout should contain lines:
      """
      --mono
      """

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
