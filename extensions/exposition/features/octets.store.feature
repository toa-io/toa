Feature: Download and store

  Scenario Outline: Download from trusted location defined as <type>
    Given the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store:
            trust:
              - <location> # <type>
        /*:
          GET:
            octets:fetch: ~
      """

    When the following request is received:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-location: https://avatars.githubusercontent.com/u/92763022?s=48&v=4
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """

    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: image/png
      content-length: 1234
      """

    # untrusted location
    When the following request is received:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-location: https://github.githubassets.com/assets/yolo-default-be0bbff04951.png
      accept: text/plain
      """
    Then the following reply is sent:
      """
      403 Forbidden

      Location is not trusted.
      """

    Examples:
      | type       | location                                 |
      | origin     | https://avatars.githubusercontent.com    |
      | expression | ^https://avatars\.githubusercontent\.com |
