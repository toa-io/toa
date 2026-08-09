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
    Given an encoded environment variable `TOA_TELEMETRY_TRACES` is set to:
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
    Given an encoded environment variable `TOA_TELEMETRY_LOGS` is set to:
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
    Given an encoded environment variable `TOA_TELEMETRY_LOGS_DEFAULT_TELEMETRY` is set to:
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
              value: eyJsZXZlbCI6ImluZm8ifQ==
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
              value: eyJsZXZlbCI6ImluZm8ifQ==
            - name: TOA_TELEMETRY_LOGS_DEFAULT_TELEMETRY
              value: eyJsZXZlbCI6Indhcm4ifQ==
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
            delay: 3
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
              value: ZmFsc2U=
      """

  Scenario: Composition becomes ready
    Given I compose `dummies.one` component
    When I request ready probe
    Then ready probe status is 200
