Feature: Deployment

  Background:
    Given I have a kube context kind-kind

  Scenario: Deploy two components
    Given I have components:
      | dummies.one |
      | dummies.two |
      | stash       |
    And I have a context
    When I run `toa conceal amqp-context.default username=developer password=secret`
    And I run `toa deploy docker --wait`
    Then program should exit with code 0
    When I wait 5 seconds
    And I run `kubectl get pods`
    Then stdout should contain lines:
    """
    composition-dummies-one-<...> Running
    composition-dummies-two-<...> Running
    composition-default-stash-<...> Running
    """
    Then I run `helm uninstall collection`
    And I run `kubectl delete secret toa-bindings-amqp-default`
    And I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-one)`
    And I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-two)`
