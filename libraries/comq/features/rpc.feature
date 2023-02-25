Feature: Request-reply (RPC)

  Background:
    Given an active connection to the broker

  Scenario: Sending request and getting reply
    Given function replying `add_numbers` queue:
    """
    ({ a, b }) => { return a + b }
    """
    When the consumer sends the following request to the `add_numbers` queue:
    """yaml
    a: 1
    b: 2
    """
    Then the consumer receives the reply:
    """yaml
    3
    """
