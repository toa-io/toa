Feature: toa -v

  Output version

  Scenario: Output version
    When I run `toa -v`
    Then program should exit
    And stdout line 1 should contain version
    And stdout should contain 1 line
