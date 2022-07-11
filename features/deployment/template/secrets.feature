Feature: Deploy secrets for AMQP binding

  Scenario: Secrets for component and system bindings
    Given I have a component dummies.one
    And I have a context with:
      """
      amqp: amqps://host0:5672
      """
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      - name: TOA_BINDINGS_AMQP_DUMMIES_ONE_USERNAME
        valueFrom:
          secretKeyRef:
            name: toa-bindings-amqp-dummies-one
            key: username
            optional: false
      - name: TOA_BINDINGS_AMQP_DUMMIES_ONE_PASSWORD
        valueFrom:
          secretKeyRef:
            name: toa-bindings-amqp-dummies-one
            key: password
            optional: false
      - name: TOA_BINDINGS_AMQP_SYSTEM_USERNAME
        valueFrom:
          secretKeyRef:
            name: toa-bindings-amqp-system
            key: username
            optional: false
      - name: TOA_BINDINGS_AMQP_SYSTEM_PASSWORD
        valueFrom:
          secretKeyRef:
            name: toa-bindings-amqp-system
            key: password
            optional: false
      """
