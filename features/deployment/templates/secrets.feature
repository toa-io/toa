Feature: Deploy secrets for AMQP binding

  Scenario: Secrets for component and system bindings
    Given I have a component dummies.one
    And I have a context
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      - name: TOA_BINDINGS_AMQP_DEFAULT_USERNAME
        valueFrom:
          secretKeyRef:
            name: toa-bindings-amqp-default
            key: username
      - name: TOA_BINDINGS_AMQP_DEFAULT_PASSWORD
        valueFrom:
          secretKeyRef:
            name: toa-bindings-amqp-default
            key: password
      """
