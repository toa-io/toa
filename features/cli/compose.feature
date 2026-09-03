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
        toa compose ./components/**/ --service exposition
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
      Runtime
      Composition complete
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
      Composition shutdown complete
      """

  Scenario: Run a composition with extension services

  The list is exact. A service the gateway talks to — the values it reads, the graph it
  publishes to — answers over the network in a deployment, so in one process it is named
  too or nothing answers it.

    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      configuration:
        identity.tokens:
          keys:
            - id: key0
              key: $IDENTITY_TOKENS_ENCRYPTION_KEY0
      """
    When I run `toa env --dev`
    And I run `toa compose ./components/* --service exposition --service configuration --service introspection --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Composition complete
      Gateway started
      Composition shutdown complete
      """

  Scenario: Run a composition with services named in the environment
    Given I have a component `exposed.one`
    And I have a context with:
      """yaml
      configuration:
        identity.tokens:
          keys:
            - id: key0
              key: $IDENTITY_TOKENS_ENCRYPTION_KEY0
      """
    When I run `toa env --dev`
    And an environment variable `TOA_SERVICES` is set to "@toa.io/extensions.exposition @toa.io/extensions.configuration @toa.io/extensions.introspection"
    And I run `toa compose ./components/* --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Gateway started
      """

  Scenario: Refuse an extension that runs no service
    Given I have a component `dummies.one`
    When I run `toa compose ./components/* --service telemetry --kill`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Service is not implemented by '@toa.io/extensions.telemetry'
      """
