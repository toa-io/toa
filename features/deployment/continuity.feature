@deployment
Feature: Continuity deployment

  Scenario: A component that continues an operation deploys the journal
    Given I have a component `continued.flow`
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: continuity-journal
      """

  Scenario: A component that continues nothing deploys no journal
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment
    Then exported values should not contain:
      """yaml
      services:
        - name: continuity-journal
      """
