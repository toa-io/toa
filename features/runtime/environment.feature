Feature: The runtime's environment is not a component's

  What the runtime was deployed with — the addresses and credentials of its storages and
  brokers, the secrets a configuration refers to — is read by the runtime and by nothing
  a component's code can reach: not `process.env`, not a bash operation's environment.

  Scenario: A configuration secret is resolved for the component and hidden from its code
    Given an environment variable `TOA_CONFIGURATION__SECRET_B` is set to 'hidden'
    And the configuration of `configuration.secrets` is deployed with:
      """yaml
      a: 1
      b: $SECRET_B
      """
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    And I compose components:
      | configuration.secrets |
      | echo.beacon           |
    # `print` returns what the component's code reads from `process.env`
    When I call `echo.beacon.print` with:
      """yaml
      input: TOA_CONFIGURATION__SECRET_B
      """
    Then the reply is received:
      """yaml
      (unset)
      """
    When I call `configuration.secrets.reveal`
    Then the reply is received:
      """yaml
      hidden
      """

  Scenario: A configuration update after boot still resolves the secret
    Given an environment variable `TOA_CONFIGURATION__SECRET_B` is set to 'hidden'
    And the configuration of `configuration.secrets` is deployed with:
      """yaml
      a: 1
      b: $SECRET_B
      """
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    And I compose `configuration.secrets` component
    When I call `configuration.values.create` with:
      """yaml
      input:
        component: configuration.secrets
        configuration:
          a: 2
          b: $SECRET_B
        originator:
          id: tester
      """
    And I wait 1 second
    And I call `configuration.secrets.echo`
    Then the reply is received:
      """yaml
      a: 2
      b: <REDACTED>
      """
    When I call `configuration.secrets.reveal`
    Then the reply is received:
      """yaml
      hidden
      """

  Scenario: The runtime's own variables are hidden from a component's code
    Given an environment variable `TOA_MONGODB_ECHO_BEACON_PASSWORD` is set to 'hush'
    And I compose `echo.beacon` component
    When I call `echo.beacon.print` with:
      """yaml
      input: TOA_MONGODB_ECHO_BEACON_PASSWORD
      """
    Then the reply is received:
      """yaml
      (unset)
      """
    # the runtime reads it on every reply, so the composition running proves it still has it
    When I call `echo.beacon.print` with:
      """yaml
      input: TOA_ENV
      """
    Then the reply is received:
      """yaml
      (unset)
      """

  # A process sets what the processes it starts are given; its own names stay what it booted with.
  Scenario: The suffix is read as the process boots
    Given an environment variable `TOA_SUFFIX` is set to "-boot"
    And the `mongo.one` database in "toa-dev-boot" is empty
    And the `mongo.once` database in "toa-dev-boot" is empty
    And I compose `mongo.one` component
    And `TOA_SUFFIX` is set to "-later" in `process.env`
    And I compose `mongo.once` component
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: boot
      """
    And I call `mongo.once.plain` with:
      """yaml
      input:
        foo: 2
        bar: later
      """
    Then the `mongo.one` collection in "toa-dev-boot" holds:
      | foo | bar  |
      | 1   | boot |
    And the `mongo.once` collection in "toa-dev-boot" holds:
      | foo | bar   |
      | 2   | later |

  Scenario: A suffix that is not a name is refused
    Given an environment variable `TOA_SUFFIX` is set to "copy/1"
    Then I compose `echo.beacon` component and it fails with a message containing:
      """
      TOA_SUFFIX
      """
