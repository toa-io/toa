@cli
Feature: toa serve

  Run service

  Scenario: Show `toa serve` help
    When I run `toa serve --help`
    Then program should exit
    And stdout should contain lines:
    """
    toa serve [paths...]
    Run an extension service
      toa serve exposition
      toa serve exposition configuration
      toa serve ./extensions/exposition
    """

  Scenario Outline: Run a service

  Service may be addressed by:
  - relative path
  - package name
  - shortcut

    Given my working directory is /toa
    And environment variables:
      """
      TOA_STORAGES={"tmp":{"provider":"tmp","directory":"test"}}
      TOA_CONFIGURATION_IDENTITY_BASIC={}
      TOA_CONFIGURATION_IDENTITY_CLIENTS={}
      TOA_CONFIGURATION_IDENTITY_FEDERATION={}
      TOA_CONFIGURATION_IDENTITY_GRANTS={}
      TOA_CONFIGURATION_IDENTITY_OTP={}
      TOA_CONFIGURATION_IDENTITY_PASSKEYS={}
      TOA_CONFIGURATION_IDENTITY_TOKENS={"keys":[{"id":"key0","key":"$IDENTITY_TOKENS_KEY0"}]}
      TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0=sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs
      TOA_EXPOSITION_PROPERTIES={"authorities":{"default":"localhost"},"port":31000,"probe":31004}
      TOA_AMQP_CONTEXT={".":["amqp://localhost:31010"]}
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    When I run `toa serve <reference>`
    And I wait 2 seconds
    And I abort execution
    Then stderr should be empty
    And stdout should contain lines:
      """
      Gateway started
      """

    Examples:
      | reference                     |
      | ./extensions/exposition       |
      | extensions/exposition         |
      | @toa.io/extensions.exposition |
      | exposition                    |

  Scenario: Run several services

  The list is exact. A service the named ones talk to answers over the network in a
  deployment, so in one process it is named too or nothing answers it.

    Given my working directory is /toa
    And environment variables:
      """
      TOA_STORAGES={"tmp":{"provider":"tmp","directory":"test"}}
      TOA_CONFIGURATION_IDENTITY_BASIC={}
      TOA_CONFIGURATION_IDENTITY_CLIENTS={}
      TOA_CONFIGURATION_IDENTITY_FEDERATION={}
      TOA_CONFIGURATION_IDENTITY_GRANTS={}
      TOA_CONFIGURATION_IDENTITY_OTP={}
      TOA_CONFIGURATION_IDENTITY_PASSKEYS={}
      TOA_CONFIGURATION_IDENTITY_TOKENS={"keys":[{"id":"key0","key":"$IDENTITY_TOKENS_KEY0"}]}
      TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0=sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs
      TOA_EXPOSITION_PROPERTIES={"authorities":{"default":"localhost"},"port":31000,"probe":31004}
      TOA_INTROSPECTION={"samples":false,"interval":300,"threshold":1024,"ui":true}
      TOA_AMQP_CONTEXT={".":["amqp://localhost:31010"]}
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    When I run `toa serve exposition configuration introspection`
    And I wait 2 seconds
    And I abort execution
    Then stderr should be empty
    And stdout should contain lines:
      """
      Gateway started
      Configuration UI started
      Introspection explorer started
      """
