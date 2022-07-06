Feature: Exposition Deployment

  Background:
    Given I have a component dummies.three
    # which declares exposition
    And I have a context
    And I run `toa export images ./images`

  Scenario: Dockerfile has correct command
    Then the file ./images/*exposition*/Dockerfile should contain exact line 'CMD toa serve .'

#  Scenario: Exported exposition is runnable
#    Given my working directory is ./images/*exposition*
#    When I run `toa serve`
#    And I wait 0.5 seconds
#    Then I disconnect
