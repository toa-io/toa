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
    Then the environment contains:
      """
      TOA_ENV=some
      TOA_BINDINGS_AMQP_POINTER=eyJkZWZhdWx0IjoiYW1xcDovL2RldmVsb3BlcjpzZWNyZXRAc29tZS5ob3N0In0=
      TOA_BINDINGS_AMQP_DEFAULT_USERNAME=
      TOA_BINDINGS_AMQP_DEFAULT_PASSWORD=
      """

  Scenario: Keeping secret values while switching environment
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        default: amqp://whatever
        default@some: amqp://developer:secret@some.host
        default@dev: amqp://developer:secret@dev.host
      """
    When I run `toa env some`
    And I update an environment with:
      """
      TOA_BINDINGS_AMQP_DEFAULT_USERNAME=test
      """
    And I run `toa env dev`
    Then the environment contains:
      """
      TOA_ENV=dev
      TOA_BINDINGS_AMQP_POINTER=eyJkZWZhdWx0IjoiYW1xcDovL2RldmVsb3BlcjpzZWNyZXRAZGV2Lmhvc3QifQ==
      TOA_BINDINGS_AMQP_DEFAULT_USERNAME=test
      TOA_BINDINGS_AMQP_DEFAULT_PASSWORD=
      """

  Scenario Outline: Setting `local` environment
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa <command>`
    Then the environment contains:
      """
      TOA_ENV=local
      TOA_BINDINGS_AMQP_DEFAULT_USERNAME=
      TOA_BINDINGS_AMQP_DEFAULT_PASSWORD=
      """
    Examples:
      | command   |
      | env       |
      | env local |

  Scenario: Component-specific variables
    Given I have a component `origins.http`
    And I have a context with:
      """
      origins:
        origins.http:
          bad: http://localhost:8888/
      """
    When I run `toa env`
    Then the environment contains:
      """
      TOA_ORIGINS_ORIGINS_HTTP=eyJiYWQiOiJodHRwOi8vbG9jYWxob3N0Ojg4ODgvIn0=
      """

  Scenario Outline: Print an environment variable
    Given I have a component `echo.beacon`
    And I have a context
    And I run `toa env`
    And I update an environment with:
      """
      FOO=bar
      """
    And my working directory is <cwd>
    When I run `toa invoke print "{ input: 'FOO' }" -p <path>`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      { output: 'bar' }
      """
    Examples:
      | cwd                      | path                     |
      | ./                       | ./components/echo.beacon |
      | ./components/echo.beacon | .                        |

  Scenario: Export environment to a custom file name
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa env some --as .env.some`
    Then the file ./.env.some should contain exact line 'TOA_ENV=some'
