Feature: Telemetry

  Scenario Outline: <level> log
    Given I boot `telemetry` component
    When I invoke `log` with:
      """yaml
      input:
        level: <level>
        message: "Hello, world!"
        attributes:
          foo: bar
      """
    Examples:
      | level |
      | debug |
      | info  |
      | warn  |
      | error |

  Scenario: Tracing an invocation
    Given I boot `telemetry` component
    When I invoke `trace` with:
      """yaml
      input:
        value: 21
      """
    Then the reply is received:
      """yaml
      42
      """

  # no TRACE entries are expected in the output, while logs still carry trace_id
  Scenario: Tracing an invocation with sampling disabled
    Given an environment variable `TOA_TELEMETRY_TRACES` is set to:
      """yaml
      sample: 0
      """
    And I boot `telemetry` component
    When I invoke `trace` with:
      """yaml
      input:
        value: 21
      """
    Then the reply is received:
      """yaml
      42
      """

  # requires tempo (docker compose up tempo)
  # open http://localhost:31080 (Explore > Tempo) to see the trace
  Scenario: Exporting traces over OTLP
    Given an environment variable `TOA_TELEMETRY_TRACES` is set to:
      """yaml
      exporters:
        console: ~
        otlp:
          endpoint: http://localhost:31061
      """
    And I boot `telemetry` component
    When I invoke `trace` with:
      """yaml
      input:
        value: 21
      """
    Then the reply is received:
      """yaml
      42
      """

  Scenario: A metric is recorded on an unsampled trace
    Given an environment variable `TOA_TELEMETRY_TRACES` is set to:
      """yaml
      sample: 0
      exporters:
        console: ~
      """
    And I boot `telemetry` component
    When I invoke `trace` with:
      """yaml
      input:
        value: 21
      """
    Then the reply is received:
      """yaml
      42
      """
    And the metric `toa.operation.duration` is recorded with:
      """yaml
      component: default.telemetry
      operation: trace
      """

  Scenario: Trace propagation over remote calls
    Given I compose components:
      | math.calculations |
      | math.proxy        |
    When I call `math.proxy.sum` with:
      """yaml
      input:
        a: 1
        b: 2
      """
    Then the reply is received:
      """yaml
      3
      """
    And I disconnect

  Scenario: Default level is `info`
    Given I boot `telemetry` component
    When I invoke `log` with:
      """yaml
      input:
        level: info
        message: "level: info"
      """
    When I invoke `log` with:
      """yaml
      input:
        level: debug
        message: "level: debug"
      """

  Scenario: Logs env
    Given an environment variable `TOA_TELEMETRY_LOGS` is set to:
      """yaml
      level: info
      """
    And I boot `telemetry` component
    When I invoke `log` with:
      """yaml
      input:
        level: debug
        message: "Hello, world!"
      """
    And I invoke `log` with:
      """yaml
      input:
        level: error
        message: "Hello, world!"
      """

  Scenario: Logs env override
    Given an environment variable `TOA_TELEMETRY_LOGS_DEFAULT_TELEMETRY` is set to:
      """yaml
      level: warn
      """
    And I boot `telemetry` component
    When I invoke `log` with:
      """yaml
      input:
        level: info
        message: "Hello, world!"
      """
    And I invoke `log` with:
      """yaml
      input:
        level: warn
        message: "Hello, world!"
      """

  Scenario: Logs annotations
    Given I have a component `telemetry`
    And I have a context with:
      """yaml
      telemetry:
        logs:
          level: info
      """
    When I export deployment
    Then exported values should contain:
      """
      compositions:
        - name: default-telemetry
          variables:
            - name: TOA_TELEMETRY_LOGS
              value: '{"level":"info"}'
      """

  Scenario: Logs annotations override
    Given I have a component `telemetry`
    And I have a context with:
      """yaml
      telemetry:
        logs:
          level: info
          default.telemetry:
            level: warn
      """
    When I export deployment
    Then exported values should contain:
      """
      compositions:
        - name: default-telemetry
          variables:
            - name: TOA_TELEMETRY_LOGS
              value: '{"level":"info"}'
            - name: TOA_TELEMETRY_LOGS_DEFAULT_TELEMETRY
              value: '{"level":"warn"}'
      """

  Scenario: Metrics annotations
    Given I have a component `telemetry`
    And I have a context with:
      """yaml
      telemetry:
        metrics:
          interval: 5000
          exporters:
            otlp:
              endpoint: http://prometheus:9090/api/v1/otlp
      """
    When I export deployment
    Then exported values should contain:
      """
      compositions:
        - name: default-telemetry
          variables:
            - name: TOA_TELEMETRY_METRICS
              value: '{"interval":5000,"exporters":{"otlp":{"endpoint":"http://prometheus:9090/api/v1/otlp"}}}'
      """

  Scenario: Metrics annotations are validated
    Given I have a component `telemetry`
    And I have a context with:
      """yaml
      telemetry:
        metrics:
          exporters:
            otlp:
              timeout: 1000
      """
    Then exporting deployment fails with:
      """
      telemetry.metrics.exporters.otlp.endpoint is required
      """

  Scenario: Logs without annotations
    Given I have a component `telemetry`
    And I have a context
    When I export deployment
    Then exported values should contain:
      """
      compositions:
        - name: default-telemetry
      """

  Scenario: Ready probe is declared by default
    Given I have a component `telemetry`
    And I have a context
    When I export deployment
    Then exported values should contain:
      """
      compositions:
        - name: default-telemetry
          probe:
            path: /.ready
            port: 8001
          variables:
            - name: TOA_TELEMETRY_READY
      """

  Scenario: Ready can be disabled
    Given I have a component `telemetry`
    And I have a context with:
      """yaml
      telemetry:
        ready: false
      """
    When I export deployment
    Then exported values should contain:
      """
      compositions:
        - name: default-telemetry
          variables:
            - name: TOA_TELEMETRY_READY
              value: 'false'
      """

  Scenario: A process becomes ready
    Given I run `dummies.one` component
    When I request ready probe
    Then ready probe status is 200
