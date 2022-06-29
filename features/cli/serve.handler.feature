Feature: Serve a service

  Scenario Outline: Reference by path

  This reproduces the problem with `directory.find` from @toa.libraries/generic.
  See source code for details.

    Given my working directory is ./
    When I call serve
      | path | <reference> |
    And I wait 0.5 seconds
    Then I disconnect

    Examples:
      | reference               |
      | ./extensions/exposition |
      | extensions/exposition   |
