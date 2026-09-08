@deployment
Feature: Convergence deployment

  One context declares every region there is, and a deployment is one of them. Which one is
  read where it is deployed, and what reaches the runtime is the rank to stamp and the brokers
  to carry a channel over — never the table.

  Background:
    Given I have a component `store.orders`

  Scenario: Deploy a context as one of its regions
    Given an environment variable `TOA_CONVERGENCE_REGION` is set to "us"
    And I have a context with:
      """yaml
      convergence:
        - region: eu
          priority: 0
          binding: { provider: amqp, pointer: amqp://cnv-eu.example.com }
        - region: us
          priority: 1
          binding: { provider: amqp, pointer: amqp://cnv-us.example.com }
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      variables:
        - name: TOA_CONVERGENCE_BROKERS
          value: amqp://cnv-us.example.com
        - name: TOA_CONVERGENCE_BROKERS_USERNAME
          secret:
            name: toa-convergence-brokers
            key: username
        - name: TOA_CONVERGENCE_BROKERS_PASSWORD
          secret:
            name: toa-convergence-brokers
            key: password
        - name: TOA_REGION
          value: '1'
        - name: TOA_CONVERGENCE_BINDING
          value: '@toa.io/bindings.amqp'
      """
