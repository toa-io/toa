Feature: MongoDB storage

  Scenario: Create a record with environment
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
