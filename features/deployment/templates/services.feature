Feature: Service Deployment

  Scenario: Deploy service with system variables
    Given I have a component `exposed.one`
    And I have a context
    When I export deployment for dev
    And I run `helm template deployment`
    Then program should exit
    And extensions-exposition-gateway Deployment container spec should contain:
      """
      env:
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
