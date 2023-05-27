Feature: toa -v

  Output version

  Scenario: Output version
    When I run `toa -v`
    Then stdout should be the version
