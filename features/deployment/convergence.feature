@deployment
Feature: Convergence deployment

  A deployment is one region, and the environment is which one. What reaches the runtime is the
  rank to stamp, the binding, and this region's brokers — never a table, because a record says
  for itself which region wrote it.

  Background:
    Given I have a component `mongo.converging`

  Scenario: Deploy a context as one of its regions
    Given I have a context with:
      """yaml
      convergence@eu:
        priority: 0
        binding: { provider: amqp, pointer: amqp://cnv-eu.example.com }
      convergence@us:
        priority: 1
        binding: { provider: amqp, pointer: amqp://cnv-us.example.com }
      """
    When I export deployment for us
    Then exported values should contain:
      """yaml
      compositions:
        - name: mongo-converging
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

  Scenario: Deploy the same context as the other region
    Given I have a context with:
      """yaml
      convergence@eu:
        priority: 0
        binding: { provider: amqp, pointer: amqp://cnv-eu.example.com }
      convergence@us:
        priority: 1
        binding: { provider: amqp, pointer: amqp://cnv-us.example.com }
      """
    When I export deployment for eu
    Then exported values should contain:
      """yaml
      compositions:
        - name: mongo-converging
          variables:
            - name: TOA_CONVERGENCE_BROKERS
              value: amqp://cnv-eu.example.com
            - name: TOA_REGION
              value: '0'
      """

  Scenario: Deploy an environment that is not a region
    Given I have a context with:
      """yaml
      convergence@eu:
        priority: 0
        binding: { provider: amqp, pointer: amqp://cnv-eu.example.com }
      """
    When I export deployment for staging
    Then exported values should not contain:
      """yaml
      compositions:
        - name: mongo-converging
          variables:
            - name: TOA_REGION
      """
