Feature: Export local deployment environment variables

  Scenario: Show help
    When I run `toa export variables --help`
    And stdout should contain lines:
      """
      toa export variables
      Print manifest
        -p, --path
      """

  Scenario: Export AMQP variables
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        default: amqp://whatever
        default@local: amqp://developer:secret@localhost
      """
    When I run `toa export variables local`
    Then stderr should be empty
    And stdout should contain lines:
      """
      TOA_BINDINGS_AMQP_POINTER=
      """
