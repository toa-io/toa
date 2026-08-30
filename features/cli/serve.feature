Feature: toa serve

  Run service

  Scenario: Show `toa serve` help
    When I run `toa serve --help`
    Then program should exit
    And stdout should contain lines:
    """
    toa serve [path]
    Run an extension service
    """

  Scenario Outline: Run a service

  Service may be addressed by:
  - relative path
  - package name
  - shortcut

    Given my working directory is /toa
    And environment variables:
      """
      TOA_STORAGES=eyJ0bXAiOnsicHJvdmlkZXIiOiJ0bXAiLCJkaXJlY3RvcnkiOiJ0ZXN0In19
      TOA_CONFIGURATION_IDENTITY_TOKENS=eyJrZXlzIjpbeyJpZCI6ImtleTAiLCJrZXkiOiIkSURFTlRJVFlfVE9LRU5TX0tFWTAifV19
      TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0=sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs
      TOA_EXPOSITION_PROPERTIES=eyJhdXRob3JpdGllcyI6eyJkZWZhdWx0IjoibG9jYWxob3N0In19
      TOA_AMQP_CONTEXT=eyIuIjpbImFtcXA6Ly9sb2NhbGhvc3QiXX0=
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
