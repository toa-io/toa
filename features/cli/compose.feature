Feature: toa compose

  Run composition

  Scenario: Show `toa compose` help
    When I run `toa compose --help`
    And stdout should contain lines:
      """
      toa compose [paths...]
      Run composition
        toa compose ./component
        toa compose ./first ./second
        toa compose ./components/**/
        toa compose ./a/**/ ./b/**/
      """

  Scenario Outline: Run compositions from <working directory>
    Given I have components:
      | dummies.one |
      | dummies.two |
    And my working directory is <working directory>
    When I run <command>
    And I wait <delay> seconds
    And I abort execution
    Then stderr should be empty
    And stdout should contain lines:
      """
      Toa
      info Composition complete
      """
    Examples:
      | command                                | working directory        | delay |
      | `toa compose`                          | ./components/dummies.one | 0     |
      | `toa compose dummies.one dummies.two`  | ./components             | 0     |
      | `toa compose ./components/dummies.two` | ./                       | 0     |
      | `toa compose ./**/*`                   | ./                       | 1     |

  Scenario: Shutdown composition after it's started
    Given I have a component `dummies.one`
    When I run `toa compose ./components/* --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      info Composition shutdown complete
      """

  Scenario: Run composition in docker
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa env docker`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    And I run `toa compose ./components/* --dock --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      info Composition shutdown complete
      """

  Scenario: Run composition in docker with custom env file
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa env docker --as .env.docker`
    And I update an environment file `.env.docker` with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    And I run `toa compose ./components/* --dock --kill --env .env.docker`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      info Composition shutdown complete
      """

  Scenario: Run composition in docker with custom context runtime options
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa env broken-runtime --as .env.broken`
    And I run `toa compose ./components/* --dock --kill --env .env.broken`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      <...>npm ERR! code EUNSUPPORTEDPROXY
      """

  Scenario: Run composition in docker with custom context build options
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa env broken-build --as .env.broken`
    And I run `toa compose ./components/* --dock --kill --env .env.broken`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      <...>no-such-command" did not complete successfully: exit code: 127
      """
