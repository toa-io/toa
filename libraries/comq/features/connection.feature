Feature: Tolerant Connection

  Scenario: Connecting to a Broker that isn't started yet
    Given the RabbitMQ broker is down
    When I attempt to connect to amqp://developer:secret@localhost:5673 for 0.2 seconds
    Then the connection is not established
    And no exceptions are thrown
    When the RabbitMQ broker is up
    Then the connection is established

  Scenario: Connecting with wrong credentials
    When I attempt to connect to amqp://developer:wrong-password@localhost:5673
    Then an exception is thrown: "Handshake terminated by server: 403 (ACCESS-REFUSED)"
