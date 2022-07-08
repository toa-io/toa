Feature: AMQP deployment

  Scenario: Single external broker

  Deploy context with one broker for all.

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """
      amqp: amqp://host.docker.internal:5672
      """
    When I export deployment
    Then exported values should contain:
      """
      proxies:
        - name: bindings-amqp-system
          target: host.docker.internal
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
    And I have a context with:
      """
      amqp:
        system: amqp://system-host
        dummies.one: amqp://host1
        dummies.two: amqps://host2:5761
      """
    When I export deployment
    Then exported values should contain:
      """
      proxies:
        - name: bindings-amqp-system
          target: system-host
        - name: bindings-amqp-dummies-one
          target: host1
        - name: bindings-amqp-dummies-two
          target: host2
      """
