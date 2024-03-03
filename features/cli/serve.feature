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
      TOA_CONFIGURATION_IDENTITY_TOKENS=eyJrZXkwIjoiJElERU5USVRZX1RPS0VOU19LRVkwIn0=
      TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0=k3.local.RyDuSdkJimIuxKsqZJbKGemlnizOjuXdR9QDF-Olr_A
      """
    When I run `toa serve <reference>`
    And I wait 2 seconds
    And I abort execution
    Then stderr should be empty
    And stdout should contain lines:
      """
      Gateway has started and is awaiting resource branches.
      """

    Examples:
      | reference                     |
      | ./extensions/exposition       |
      | extensions/exposition         |
      | @toa.io/extensions.exposition |
      | exposition                    |
