Feature: Component deployment

  Scenario: Deploy two components
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have context
    When I export deployment
    Then exported values should contain:
    """
    components: [dummies-one, dummies-two]
    """
