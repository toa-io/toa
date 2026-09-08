@deployment
Feature: Environment image tags

  Scenario: The chart pins the content tag
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment for production
    Then the exported composition image tag is the content hash
