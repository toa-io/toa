Feature: Deployment render

  Scenario: Export deployment and render it with Helm
    Given I have a component dummies.one
    And I have a context
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stderr should be empty
