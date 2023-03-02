Feature: Topology Recovery

  Background:
    Given an active connection to the broker

  Scenario: Defining a producer while broker is down
    Given the broker has crashed
    And function replying `add_numbers` queue is expected:
    """
    ({ a, b }) => { return a + b }
    """
    When the broker is up
    And the consumer sends the following request to the `add_numbers` queue:
    """yaml
    a: 1
    b: 2
    """
    Then the consumer receives the reply:
    """yaml
    3
    """

  Scenario: Broker crashing while defining producer
    Given function replying `add_numbers` queue is expected:
    """
    ({ a, b }) => { return a + b }
    """
    And the broker has crashed
    When the broker is up
    And the consumer sends the following request to the `add_numbers` queue:
    """yaml
    a: 1
    b: 2
    """
    Then the consumer receives the reply:
    """yaml
    3
    """

  Scenario: Sending the request while broker is down
    Given function replying `add_numbers` queue:
    """
    ({ a, b }) => { return a + b }
    """
    And the broker has crashed
    When the consumer sends the following request to the `add_numbers` queue:
    """yaml
    a: 1
    b: 2
    """
    Then the broker is up
    And the consumer receives the reply:
    """yaml
    3
    """

