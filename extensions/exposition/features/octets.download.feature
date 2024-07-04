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
              - https://github.com
        /*:
          GET:
            octets:fetch: ~
      """

    When the following request is received:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-location: https://avatars.githubusercontent.com/u/92763022?s=48&v=4
      content-length: 0
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      type: image/png
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
      content-length: 1288
      """

    # untrusted location
    When the following request is received:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-location: https://github.githubassets.com/assets/yolo-default-be0bbff04951.png
      content-length: 0
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden

      Location is not trusted
      """

    # content-length must be 0
    When the following request is received:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-location: https://avatars.githubusercontent.com/u/92763022?s=48&v=4
      content-length: 1
      accept: application/yaml

      1
      """
    Then the following reply is sent:
      """
      400 Bad Request

      Content-Length must be 0 when Content-Location is used
      """

    # invalid content-location
    When the following request is received:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-location: Hello there!
      content-length: 0
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden

      Location is not trusted
      """

    # unavailable location
    When the following request is received:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-location: https://github.com/toa-io/no
      content-length: 0
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found

      Location is not available
      """

    Examples:
      | type       | location                                   |
      | origin     | https://avatars.githubusercontent.com      |
      | expression | /^https://avatars\.githubusercontent\.com/ |
