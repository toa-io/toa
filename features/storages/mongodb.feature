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
    Given environment variables:
      """
      TOA_DEV=0
      TOA_MONGODB_MONGO_ONE=mongodb://localhost:27018
      TOA_MONGODB_MONGO_ONE_USERNAME=testcontainersuser
      TOA_MONGODB_MONGO_ONE_PASSWORD=secret
      TOA_ENV=local
      TOA_AMQP_CONTEXT=eyIuIjpbImFtcXA6Ly9sb2NhbGhvc3QiXX0=
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    When I start docker container `mongodb`
    And I compose `mongo.one` component
    And I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: 'test'
      """
    Then the reply is received
    When I stop docker container `mongodb`
    And I call `mongo.one.transit` without waiting with:
      """yaml
      input:
        foo: 1
        bar: 'test'
      """
    And I wait 3 seconds
    Then the pending reply is not received yet
    When I start docker container `mongodb`
    Then the pending reply is received
    And I disconnect
    
  Scenario: Connect to MongoDB with uncorrect url parameter
    Given environment variables:
      """
      TOA_DEV=0
      TOA_MONGODB_MONGO_ONE=mongodb://localhost:27018?replset=rs0
      TOA_MONGODB_MONGO_ONE_USERNAME=testcontainersuser
      TOA_MONGODB_MONGO_ONE_PASSWORD=secret
      TOA_ENV=local
      TOA_AMQP_CONTEXT=eyIuIjpbImFtcXA6Ly9sb2NhbGhvc3QiXX0=
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    Then a failure is expected
    When I compose `mongo.one` component
    And it fails with:
    """
    option replset is not supported
    """
