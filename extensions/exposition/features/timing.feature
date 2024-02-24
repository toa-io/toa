Feature: Server timing

  Background:
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST: transit
      """

  Scenario: Server timing is not available by default
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      content-type: application/yaml

      title: Hello
      volume: 1.5
      """
    Then the reply does not contain:
      """
      server-timing:
      """

  Scenario: Server timing is sent when debug is enabled
    Given the annotation:
      """
      debug: true
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      content-type: application/yaml

      title: Hello
      volume: 1.5
      """
    # to debug, break it and look at the console
    Then the following reply is sent:
      """
      201 Created
      server-timing: 1
      """
