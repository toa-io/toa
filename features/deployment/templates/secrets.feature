Feature: Deploy secrets for AMQP binding

  Scenario: Secrets for component and system bindings
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment
    And I run `helm template deployment`
    Then program should exit
    And stdout should contain lines:
      """
      - name: TOA_AMQP_CONTEXT__USERNAME
        valueFrom:
          secretKeyRef:
            name: toa-amqp-context.default
            key: username
      - name: TOA_AMQP_CONTEXT__PASSWORD
        valueFrom:
          secretKeyRef:
            name: toa-amqp-context.default
            key: password
      """
