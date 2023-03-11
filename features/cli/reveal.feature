Feature: Reveal Secrets

  Background:
    Given I have a kube context kind-kind
    Then I run `toa conceal database username MyUserName`
    And program should exit
    And I run `toa conceal database password MySecretPassword`
    And program should exit
    And I run `toa conceal network address 1.1.1.1`
    And program should exit

  Scenario: Reveal a secret
    When I run `toa reveal database`
    Then program should exit
    And stdout should contain lines:
      """
      username: MyUserName
      password: MySecretPassword
      """
