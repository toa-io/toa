Feature: Components with MongoDB

  Scenario: Export image
    Given I have a component `mongo.one`
    And I have a context
    And I run `toa export images dev ./images`
    Then program should exit with code 0

