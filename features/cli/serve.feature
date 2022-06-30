Feature: toa serve

  Run service

  Scenario: Show help
    When I run `toa serve --help`
    Then program should exit
    And stdout should contain lines:
    """
    toa serve [path]
    Run service
    """

  Scenario Outline: Run service

  Service may be addressed by:
  - relative path
  - package name
  - shortcut

    Given my working directory is ./
    When I run `toa serve <reference>`
    And I wait 0.5 seconds
    And abort
    Then stderr should be empty

    Examples:
      | reference                     |
      | ./extensions/exposition       |
      | extensions/exposition         |
      | @toa.io/extensions.exposition |
      | exposition                    |
