@cli
Feature: Print what a region needs on its convergence broker

  A queue has to exist before the region it is for runs anything, and which queues those are is
  not something an operator can assemble by hand. This prints them; declaring them is theirs,
  because the broker's credentials are secrets no context carries.

  Background:
    Given I have a component `mongo.converging`
    And I have a context with:
      """yaml
      convergence@eu:
        priority: 0
        binding: { provider: amqp, pointer: amqp://cnv-eu.example.com }
      convergence@us:
        priority: 1
        binding: { provider: amqp, pointer: amqp://cnv-us.example.com/records }
      """

  Scenario: Print the definitions of the region being added
    When I run `toa export convergence eu`
    Then stdout should contain lines:
      """
      "name": "convergence.in",
      "type": "direct",
      "durable": true,
      """
    And stdout should contain lines:
      """
      "name": "convergence.mongo.converging",
      """
    And stdout should contain lines:
      """
      "destination": "convergence.mongo.converging",
      "destination_type": "queue",
      "routing_key": "mongo.converging",
      """

  Scenario: Say what to do with them, without putting it in what is piped
    When I run `toa export convergence eu`
    Then stderr should contain lines:
      """
      # 1 component converges in 'eu'.
      """
    And stderr should contain lines:
      """
      /api/definitions
      """

  Scenario: Declare into the vhost the region's brokers name
    When I run `toa export convergence us`
    Then stdout should contain lines:
      """
      "vhost": "records",
      """

  Scenario: Print invocations for a broker whose management API is out of reach
    When I run `toa export convergence eu --format=commands`
    Then stdout should contain lines:
      """
      rabbitmqadmin declare exchange name=convergence.in type=direct durable=true
      rabbitmqadmin declare exchange name=convergence.out type=direct durable=true
      rabbitmqadmin declare queue name=convergence.mongo.converging durable=true
      """

  Scenario: Refuse an environment that is not a region
    When I run `toa export convergence staging`
    Then stderr should contain lines:
      """
      Environment 'staging' declares no convergence, so it is not a region.
      """
