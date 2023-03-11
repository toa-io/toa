Feature: Service Deployment

  Scenario: Deploy service with system variables
    Given I have a component `exposed.one`
    And I have a context
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And service-exposition-resources Deployment container spec should contain:
      """
      env:
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
