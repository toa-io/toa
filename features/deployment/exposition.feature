Feature: Exposition Deployment

  Scenario: Dockerfile has correct command
    Given I have a component dummies.three
    # which declares exposition
    And I have a context
    When I run `toa export images ./images`
    Then program should exit
    And the file ./images/*exposition*/Dockerfile should contain exact line 'CMD toa serve .'
