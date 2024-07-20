Feature: Realtime events

  Background:
    Given the Realtime is running with the following annotation:
      """yaml
      users.properties.sync: id
      """
    And the identity Bob is consuming realtime events

  Scenario: Getting realtime events
    Given the `users.properties` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          anonymous: true
          io:output: false
          PATCH: transit
      """
    When the following request is received:
      """
      PATCH /users/properties/${{ Bob.id }}/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      newbie: false
      """
    Then the following reply is sent:
      """
      200 OK
      """
    And the following event `users.properties.sync` is received by Bob:
      """yaml
      newbie: false
      """
