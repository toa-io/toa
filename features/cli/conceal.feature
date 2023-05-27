Feature: Deploy secrets

  Scenario: Print help
    When I run `toa conceal --help`
    Then stdout should contain lines:
      """
      toa conceal <secret> <key> <value>
      Deploy a key with a value to a secret
      """

  Scenario: Deploy a new secret
    Given I have a kube context kind-kind
    When I run `toa conceal database password mySecretPassword`
    Then stderr should be empty
    When I run `kubectl get secrets`
    Then stdout should contain lines:
      """
      toa-database
      """
    When I run `kubectl get secret toa-database -o jsonpath='{.data}' -o yaml`
    Then stdout should contain lines:
      """
      password: bXlTZWNyZXRQYXNzd29yZA==
      """
    Then I run `kubectl delete secret toa-database`

