Feature: Server timing

  Background:
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST: create
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
      trace: true
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
      server-timing:
      """

  Scenario: Octets timing
    Given the annotation:
      """yaml
      trace: true
      /:
        io:output: true
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store: ~
      """
    When the stream of `lenna.png` is received with the following headers:
      """
      POST / HTTP/1.1
      content-type: application/octet-stream
      """
    # to debug, break it and look at the console
    Then the following reply is sent:
      """
      201 Created
      server-timing:
      """
