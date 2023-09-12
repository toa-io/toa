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

#  Scenario Outline: Run service
#
#  Service may be addressed by:
#  - relative path
#  - package name
#  - shortcut
#
#    Given my working directory is /toa
#    When I run `toa serve <reference>`
#    And I wait 0.5 seconds
#    And I abort execution
#    Then stderr should be empty
#
#    Examples:
#      | reference                     |
#      | ./extensions/exposition       |
#      | extensions/exposition         |
#      | @toa.io/extensions.exposition |
#      | exposition                    |
