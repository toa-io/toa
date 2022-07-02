Feature: Deploy compositions

  Scenario: Default compositions

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have context
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
