Feature: Deploy secrets

  Scenario: Print help
    When I run `toa conceal --help`
    Then stdout should contain lines:
      """
      toa conceal [secret] [key] [value]
      Deploy a key with a value to a secret
      """

  Scenario: Deploy a new secret
    Given I have a kube context kind-kind
    When I run `toa conceal database password mySecretPassword`
    Then program should exit
    And stderr should be empty
    When I run `kubectl get secrets`
    Then program should exit
    And stdout should contain lines:
      """
      database
      """
    Then I run `kubectl get secret database -o jsonpath='{.data}' -o yaml`
    Then program should exit
    And stdout should contain lines:
      """
      password: bXlTZWNyZXRQYXNzd29yZA==
      """
    Then I run `kubectl delete secret database`

  Scenario: List secret keys
    Given I have a kube context kind-kind
    And I run `toa conceal database password mySecretPassword`
    And program should exit
    And I run `toa conceal database address 1.1.1.1`
    And program should exit
    Then I run `toa conceal database`
    And stdout should contain lines:
      """
      address, password
      """
    Then I run `kubectl delete secret database`

