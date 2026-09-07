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
