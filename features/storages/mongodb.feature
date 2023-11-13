Feature: MongoDB storage

  Scenario: Create a record with environment in MongoDB
    Given I have a component `mongo.one`
    And I have a context with:
      """yaml
      mongodb: mongodb://localhost
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      TOA_MONGODB_MONGO_ONE_USERNAME=developer
      TOA_MONGODB_MONGO_ONE_PASSWORD=secret
      """
    And I run `TOA_DEV=0 toa invoke transit "{ input: { foo: 1, bar: 'test' } }" -p ./components/mongo.one`
    Then program should exit with code 0

  Scenario: Create a record in MongoDB with reconnection
    Given I have a docker container `mongodb`
    And I have a context with:
      """yaml
      mongodb: mongodb://localhost
      """
    And I stage `mongo.restart` component
    And I call `mongo.restart.transit` with:
      """yaml
      input:
        foo: 1
        bar: 'test'
      """
    Then the reply is received
    When I stop docker container `mongodb`
    And I call `mongo.restart.transit` without waiting with:
      """yaml
      input:
        foo: 1
        bar: 'test'
      """
    And I wait 1 second
    Then the pending reply is not received yet
    When I start docker container `mongodb`
    And I wait 3 second
    Then the pending reply is received
    And I disconnect
