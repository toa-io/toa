Feature: Running Prototype

  Scenario: Boot a prototype
    Given I boot `proto.dummy` component
    Then I disconnect

  Scenario: Compose a prototype with CLI
    Given I have a component `proto.dummy`
    When I run `toa compose ./components/proto.dummy --kill`
    Then program should exit with code 0

  Scenario: Apply sample to a prototype
    Given I have a component `proto.dummy`
    When I run `toa replay ./components/proto.dummy`
    Then program should exit with code 0
