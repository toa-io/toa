Feature: Pointer deployment

  Scenario Outline: URI Set deployment of <id>

  URI Set must be deployed as global variable with URI Set object encoded

    Given I have components:
      | <namespace>.one |
      | <namespace>.two |
    And I have a context with:
      """
      <id>:
        system: amqp://whatever
        <namespace>.one: <id>://host1
        <namespace>.two: <id>://host2:3000
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        global:
          - name: TOA_<PREFIX>_POINTER
      """

    Examples:
      | namespace | id      | PREFIX           |
      | dummies   | amqp    | BINDINGS_AMQP    |
      | mongo     | mongodb | STORAGES_MONGODB |

  Scenario Outline: Deployment of <id> secrets for usernames and passwords

  For each entry in URI Set a pair of `username` and `password` global secret variables must be deployed.

    Given I have components:
      | <namespace>.one |
      | <namespace>.two |
    And I have a context with:
      """
      <id>:
        system: <id>://host0:3000
        <namespace>: <id>://host1
        <namespace>.one: <id>://host2
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        global:
          - name: TOA_<PREFIX>_<NAMESPACE>_USERNAME
            secret:
              name: toa-<prefix>-<namespace>
              key: username
          - name: TOA_<PREFIX>_<NAMESPACE>_PASSWORD
            secret:
              name: toa-<prefix>-<namespace>
              key: password
          - name: TOA_<PREFIX>_<NAMESPACE>_ONE_USERNAME
            secret:
              name: toa-<prefix>-<namespace>-one
              key: username
          - name: TOA_<PREFIX>_<NAMESPACE>_ONE_PASSWORD
            secret:
              name: toa-<prefix>-<namespace>-one
              key: password
      """

    Examples:
      | namespace | id      | PREFIX           | NAMESPACE | prefix            |
      | dummies   | amqp    | BINDINGS_AMQP    | DUMMIES   | bindings-amqp     |
      | mongo     | mongodb | STORAGES_MONGODB | MONGO     | storages-mongodb |
