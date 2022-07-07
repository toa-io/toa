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
        - name: bindings-amqp-system
          target: host.docker.internal
        - name: bindings-amqp-dummies-one
          target: host.docker.internal
        - name: bindings-amqp-dummies-two
          target: host.docker.internal
      """
    And exported Chart should not contain:
      """
      dependencies:
      - name: bindings-amqp-system
        repository: https://charts.bitnami.com/bitnami
      """

  Scenario: Multiple external brokers

  Deploy context with individual broker for each component within the same namespace.

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
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
    And exported Chart should contain:
      """
      dependencies:
      - name: rabbitmq
        repository: https://charts.bitnami.com/bitnami
        alias: bindings-amqp-system
      """
