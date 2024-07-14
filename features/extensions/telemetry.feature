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
