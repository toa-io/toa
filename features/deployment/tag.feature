Feature: Docker image tags

  To use these scenarios, update image tags according to the current runtime version.

  @skip
  Scenario: Components with version in the manifest
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: dummies-one
          image: localhost:5000/collection/composition-dummies-one:0076e53d
        - name: dummies-two
          image: localhost:5000/collection/composition-dummies-two:30f2dab4
      """

  @skip
  Scenario: Composition of components with version in the manifest
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
    """
    compositions:
      - name: dummies
        components:
          - dummies.one
          - dummies.two
    """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: dummies
          image: localhost:5000/collection/composition-dummies:08137e38
      """
