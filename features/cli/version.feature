Feature: toa -v

  Output version

  Scenario: Output version
    When I run `toa -v`
    Then program should exit
    And stdout should be version
