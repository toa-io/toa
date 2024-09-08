Feature: Octets headers

  Scenario: Accessing headers
    Given the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: octets
        /*:
          POST:
            octets:put: ~
          /*:
            HEAD:
              octets:head: ~
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST /assets/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    When the following request is received:
      """
      HEAD /assets/${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/octet-stream
      content-length: 8169
      """
