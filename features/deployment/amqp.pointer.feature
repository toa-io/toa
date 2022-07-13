Feature: AMQP pointer deployment

  Scenario: URI Set deployment

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """
      amqp:
        system: amqp://whatever
        dummies.one: amqps://host1
        dummies.two: amqp://host2:5762
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        global:
          - name: TOA_BINDINGS_AMQP_POINTER
            value: copy-value-here
      """

  Scenario: Secrets for usernames and password for component

    Given I have a component dummies.one
    And I have a context with:
      """
      amqp:
        system: amqps://host0:5672
        dummies.one: amqp://whatever
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        dummies-one:
          - name: TOA_BINDINGS_AMQP_DUMMIES_ONE_USERNAME
            secret:
              name: toa-bindings-amqp-dummies-one
              key: username
          - name: TOA_BINDINGS_AMQP_DUMMIES_ONE_PASSWORD
            secret:
              name: toa-bindings-amqp-dummies-one
              key: password
      """

  Scenario: Secrets for usernames and password for system broker

    Given I have a component dummies.one
    And I have a context with:
      """
      amqp:
        system: amqps://host0:5672
        dummies.one: amqp://whatever
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


