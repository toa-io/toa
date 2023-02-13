Feature: Back pressure handling

  Scenario: Flooding a queue
    Given function replying `flood` queue:
    """
    () => { return new Buffer.from('ok') }
    """
    When I'm sending 20KiB requests to the `flood` queue at 5kHz for 0.2 second
    Then back pressure has been applied
