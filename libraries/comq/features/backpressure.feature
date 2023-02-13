Feature: Back pressure handling

  Background:
    Given active connection to amqp://developer:secret@localhost

  Scenario: Flooding a queue
    Given function replying `flood` queue:
    """
    () => { return new Buffer.from('ok') }
    """
    When I'm sending 20KiB requests to the `flood` queue at 5kHz for 0.2 seconds
    Then back pressure has been applied
