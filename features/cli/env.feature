Feature: Export local deployment environment variables

  Scenario: Show help
    When I run `toa env --help`
    And stdout should contain lines:
      """
      toa env
      Select environment
        -p, --path
      """

  Scenario: Select `some` environment
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        default: amqp://whatever
        default@some: amqp://developer:secret@some.host
      """
    When I run `toa env some`
    Then I have an environment with:
      """
      TOA_ENV=some
      TOA_BINDINGS_AMQP_POINTER=
      """

