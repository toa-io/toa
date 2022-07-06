Feature: AMQP deployment

  Scenario: Single external broker

  Deploy context with one broker for all.

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """
      amqp: host.docker.internal
      """
    When I export deployment
    Then exported values should contain:
      """
      proxies:
        - name: bindings-amqp-dummies-one
          target: host.docker.internal
        - name: bindings-amqp-dummies-two
          target: host.docker.internal
      """

  Scenario: Multiple external brokers

  Deploy context with individual broker for each component within the same namespace.

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have context with:
      """
      amqp:
        dummies.one: host1
        dummies.two: host2
      """
    When I export deployment
    Then exported values should contain:
      """
      proxies:
        - name: bindings-amqp-dummies-one
          target: host1
        - name: bindings-amqp-dummies-two
          target: host2
      """
