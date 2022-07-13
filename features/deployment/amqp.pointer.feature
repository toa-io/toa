Feature: AMQP pointer deployment

  Scenario: URI Set deployment

  URI Set must be deployed as global variable with URI Set object encoded

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
            value: eyJzeXN0ZW0iOiJhbXFwOi8vd2hhdGV2ZXIiLCJkdW1taWVzLm9uZSI6ImFtcXBzOi8vaG9zdDEiLCJkdW1taWVzLnR3byI6ImFtcXA6Ly9ob3N0Mjo1NzYyIn0=
      """

  Scenario: Secrets for usernames and password for component

  For each entry in URI Set a pair of `username` and `password` global secret variables must be deployed.

    Given I have a component dummies.one
    And I have a context with:
      """
      amqp:
        system: amqps://host0:5672
        dummies: amqp://host1
        dummies.one: amqps://host2
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
          - name: TOA_BINDINGS_AMQP_DUMMIES_USERNAME
            secret:
              name: toa-bindings-amqp-dummies
              key: username
          - name: TOA_BINDINGS_AMQP_DUMMIES_PASSWORD
            secret:
              name: toa-bindings-amqp-dummies
              key: password
          - name: TOA_BINDINGS_AMQP_DUMMIES_ONE_USERNAME
            secret:
              name: toa-bindings-amqp-dummies-one
              key: username
          - name: TOA_BINDINGS_AMQP_DUMMIES_ONE_PASSWORD
            secret:
              name: toa-bindings-amqp-dummies-one
              key: password
      """
