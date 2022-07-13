Feature: toa -v

  Output version

  Scenario: Output version
    When I run `toa -v`
    And stdout should be version
