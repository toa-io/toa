Feature: Reply streams

  Scenario: Getting a Reply stream
    Given the `sequences` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            endpoint: numbers
            io:output: true
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

  Scenario: A reply stream answers what the method lists of each object
    Given the `sequences` is running with the following manifest:
      """yaml
      exposition:
        /records:
          anonymous: true
          GET:
            endpoint: records
            io:output: [id, title]
      """
    When the following request is received:
      """
      GET /sequences/records/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: multipart/yaml; boundary=cut

      --cut
      ACK
      --cut
      id: '1'
      title: first
      --cut
      id: '2'
      title: second
      --cut
      FIN
      --cut--
      """
    And the reply does not contain:
      """
      secret:
      """

  Scenario: A reply stream to a method that asks for none of it
    Given the `sequences` is running with the following manifest:
      """yaml
      exposition:
        /endless:
          anonymous: true
          GET: tokens
      """
    When the following request is received:
      """
      GET /sequences/endless/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      204 No Content
      """

  Scenario: A reply stream that fails ends with FIN
    Given the `sequences` is running
    When the following stream is received:
      """
      GET /sequences/failing/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the stream ends with `FIN`

  Scenario: Stopping the Gateway while a reply streams
    Given the annotation:
      """yaml
      drain: 500
      """
    And the `sequences` is running
    When the following stream is received:
      """
      GET /sequences/tokens/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    And the Gateway is stopped
    Then the stream ends with `FIN`
    And the Gateway stopped within 1 second
