Feature: Dedicated system broker credentials deployment

  Scenario: Credentials for system AMQP binding

    Given I have a component dummies.one
    And I have a context with:
      """
      amqp:
        default: amqp://whatever
        system: amqp://host0
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        global:
          - name: TOA_BINDINGS_AMQP_SYSTEM_USERNAME
            secret:
              name: toa-bindings-amqp-system
              key: username
          - name: TOA_BINDINGS_AMQP_SYSTEM_PASSWORD
            secret:
              name: toa-bindings-amqp-system
              key: password
      """

