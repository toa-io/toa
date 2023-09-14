Feature: Image pull secret

  Scenario: Deployment with image pull secret
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      registry:
        credentials: docker-credentials-secret-name
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      credentials: docker-credentials-secret-name
      """

  Scenario: Template with image pull secret
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      registry:
        credentials: docker-credentials-secret-name
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And composition-dummies-one Deployment template.spec spec should contain:
      """yaml
      imagePullSecrets:
        - name: docker-credentials-secret-name
      """
