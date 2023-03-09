Feature: Run service by relative path

  This reproduces the problem with `directory.find` from `@toa.io/generic`.
  See [source code](../../libraries/generic/src/directory/find.js) for details.

  Scenario Outline: Run service by relative path
    Given my working directory is /toa
    When I debug command serve
      | path | <reference> |
    And I wait 0.5 seconds
    Then I disconnect

    Examples:
      | reference               |
      | ./extensions/exposition |
      | extensions/exposition   |

  Scenario: Run service from its directory
    Given my working directory is /toa/extensions/exposition
    When I debug command serve
      | path | . |
    And I wait 0.5 seconds
    Then I disconnect
