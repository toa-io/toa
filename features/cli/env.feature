Feature: Export local deployment environment variables

  Scenario: Show help
    When I run `toa env --help`
    And stdout should contain lines:
      """
      toa env
      Select environment
        -p, --path
      """

  Scenario: Export `some` environment
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        .: amqp://whatever
      """
    When I run `toa env some`
    Then the environment contains:
      """
      TOA_ENV=some
      TOA_AMQP_DUMMIES_ONE=amqp://whatever
      TOA_AMQP_DUMMIES_ONE_USERNAME=
      TOA_AMQP_DUMMIES_ONE_PASSWORD=
      """

  Scenario: Keeping secret values while switching environment
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        .: amqp://whatever
        .@some: amqp://some.host
        .@dev: amqp://dev.host
      """
    When I run `toa env some`
    And I update an environment with:
      """
      TOA_AMQP_DUMMIES_ONE_USERNAME=test
      """
    And I run `toa env dev`
    Then the environment contains:
      """
      TOA_ENV=dev
      TOA_AMQP_DUMMIES_ONE_USERNAME=test
      """

  Scenario Outline: Setting `local` environment
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa <command>`
    Then the environment contains:
      """
      TOA_ENV=local
      """
    Examples:
      | command   |
      | env       |
      | env local |

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
