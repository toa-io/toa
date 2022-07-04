Feature: Run service by relative path

  This reproduces the problem with `directory.find` from `@toa.io/libraries/generic`.
  See [source code](../../libraries/generic/src/directory/find.js) for details.

  Scenario Outline: Run service by relative path
    Given my working directory is /toa
    When I debug serve
      | path | <reference> |
    And I wait 0.5 seconds
    Then I disconnect

    Examples:
      | reference               |
      | ./extensions/exposition |
      | extensions/exposition   |
