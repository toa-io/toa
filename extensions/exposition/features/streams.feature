Feature: Reply streams

  Scenario: Getting a Reply stream
    Given the `sequences` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST: numbers
      """
    When the following request is received:
      """
      POST /sequences/ HTTP/1.1
      content-type: text/plain
      accept: text/plain

      3
      """
    Then the following reply is sent:
      """
      201 Created
      transfer-encoding: chunked

      0
      1
      2
      """
