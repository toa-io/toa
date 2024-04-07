Feature: Deployment

  Background:
    Given I have a kube context kind-kind

  Scenario: Deploy components and exposition
    Given I have components:
      | dummies.one |
      | dummies.two |
      | stash       |
      | exposed.one |
    And I have a context with:
      """
      configuration:
        identity.tokens:
          key0: secret.key.0
      """
    When I run `kubens toa-integration`
    When I run `toa conceal amqp-context.default username=developer password=secret`
    When I run `toa conceal mongodb.default username=developer password=secret`
    And I run `toa deploy docker --wait`
    Then program should exit with code 0
    When I wait 5 seconds
    And I run `kubectl get pods`
    Then stdout should contain lines:
      """
      composition-dummies-one-<...> Running
      composition-dummies-two-<...> Running
      composition-default-stash-<...> Running
      composition-exposed-one-<...> Running
      extension-exposition-gateway-<...> Running
      """
    Then I run `helm uninstall collection`
    And I run `kubectl delete secret toa-amqp-context.default`
    And I run `kubectl delete secret toa-mongodb.default`
    And I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-one)`
    And I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-two)`
    And I run `docker rmi $(docker images -q localhost:5000/collection/composition-default-stash)`
    And I run `docker rmi $(docker images -q localhost:5000/collection/composition-exposed-one)`
    And I run `docker rmi $(docker images -q localhost:5000/collection/extension-exposition-gateway)`
