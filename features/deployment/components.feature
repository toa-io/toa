Feature: Component deployment

  Scenario: Export deployment of two components
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I export deployment
    Then exported values should contain:
    """
    components: [dummies-one, dummies-two]
    """
