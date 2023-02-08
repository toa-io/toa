Feature: Request-reply (RPC)

  Scenario: Send request and get reply
    Given producer `add` is replying `add_numbers` queue
    When I send following request to `add_numbers` queue:
    """yaml
    a: 1
    b: 2
    """
    Then I get the reply:
    """yaml
    3
    """
