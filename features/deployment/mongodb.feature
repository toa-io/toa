Feature: MongoDB deployment

  Scenario: Single external MongoDB server

  Deploy context with one MongoDB server for all components.

    Given I have components:
      | mongo.one |
      | mongo.two |
    And I have a context with:
      """
      amqp: amqp://whatever
      mongodb: mongodb://host.docker.internal:27017
      """
    When I export deployment
    Then exported values should contain:
      """
      proxies:
        - name: storages-mongodb-mongo-one
          target: host.docker.internal
        - name: storages-mongodb-mongo-two
          target: host.docker.internal
      """

  Scenario: Multiple external MongoDB servers

  Deploy context with dedicated MongoDB servers per component.

    Given I have components:
      | mongo.one  |
      | mongo.two  |
      | mongo.three |
    And I have a context with:
      """
      amqp: amqp://whatever
      mongodb:
        mongo: mongodb://host1        # default for the 'mongo' namespace
        mongo.three: mongodb://host2  # exact
      """
    When I export deployment
    Then exported values should contain:
      """
      proxies:
        - name: storages-mongodb-mongo-one
          target: host1
        - name: storages-mongodb-mongo-two
          target: host1
        - name: storages-mongodb-mongo-three
          target: host2
      """
