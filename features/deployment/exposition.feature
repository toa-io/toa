Feature: Exposition Deployment

  Background:
    Given I have a component `dummies.three`
    # which declares exposition
    And I have a context

  Scenario: Dockerfile has correct command
    When I export images
    Then the file ./images/*exposition*/Dockerfile should contain exact line 'CMD toa serve .'
