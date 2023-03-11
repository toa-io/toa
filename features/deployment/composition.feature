Feature: Deploy compositions

  Scenario: Deploy two components without explicit compositions
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I export deployment
    Then exported values should contain:
    """
    compositions:
      - name: dummies-one
        components:
          - dummies-one
      - name: dummies-two
        components:
          - dummies-two
    """
