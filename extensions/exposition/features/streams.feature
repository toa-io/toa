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
      host: nex.toa.io
      content-type: text/plain
      accept: text/plain

      3
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: multipart/text; boundary=cut

      --cut
      ACK
      --cut
      0
      --cut
      1
      --cut
      2
      --cut
      FIN
      --cut--
      """
