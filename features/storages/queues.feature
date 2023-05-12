Feature: Queues Storage

  Scenario: Connecting to the broker
    Given I boot `queues.transmitter` component
    Then I disconnect

#  https://github.com/toa-io/toa/issues/298
#
#  Scenario: Receiving published message as event
#    Given I have a PostgreSQL database developer
#    And the database has a structure for the `queues.messages` component
#    And I compose components:
#      | queues.transmitter |
#      | queues.messages    |
#    When I call `queues.transmitter.transit` with:
#      """
#      input:
#        bar: test
#      """
#    And I wait 1 seconds
#    Then the table of `queues.messages` must contain rows:
#      | foo | bar  | _version |
#      | 0   | test | 1        |
#    And I disconnect
