Feature: Tolerant connection

  Scenario: Connecting to a broker that isn't started yet
    Given RabbitMQ broker is down
    When I'm connecting to amqp://developer:secret@localhost:5673 for 0.2 seconds
    Then the connection hasn't been established
    And no exceptions have been thrown
    When RabbitMQ broker is up
    Then the connection has been established
