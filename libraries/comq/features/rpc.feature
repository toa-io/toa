Feature: Request-reply (RPC)

  Scenario: Getting reply
    Given function `add` is replying `add_numbers` request queue
    When I send the request to `add_numbers` queue:
    """yaml
    a: 1
    b: 2
    """
    Then I get the reply: 3
