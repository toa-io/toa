Feature: Deployment

  Background:
    Given I have a kube context kind-kind

  Scenario: Deploy two components
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa conceal bindings-amqp-default username=developer password=secret`
    And I run `toa deploy docker --wait`
    Then program should exit with code 0
    When I run `kubectl get pods`
    Then stdout should contain lines:
    """
    composition-dummies-one-<...> Running
    composition-dummies-two-<...> Running
    """
    Then I run `helm uninstall collection --wait`

