Feature: Octets with Cloudinary storage

  Background:
    Given the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: cloudinary
        POST:
          octets:put: ~
        /*:
          GET:
            octets:get: ~
          DELETE:
            octets:delete: ~
        /video:
          octets:context: cloudinary_video
          POST:
            octets:put: ~
          /*:
            GET:
              octets:get: ~
      """

  Scenario: Upload an image
    When the stream of `lenna.png` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      id: ${{ id }}
      type: image/png
      size: 473831
      """
    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      origin: https://toa.io
      """
    Then the stream equals to `lenna.png` is sent with the following headers:
      """
      200 OK
      content-type: image/png
      content-length: 473831
      access-control-allow-origin: https://toa.io
      """

  Scenario: Upload an svg
    When the stream of `sample.svg` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      id: ${{ id }}
      type: image/svg+xml
      """
    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the stream equals to `lenna.png` is sent with the following headers:
      """
      200 OK
      content-type: image/svg+xml
      """

  Scenario: Image transformations
    When the stream of `lenna.png` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: image/png
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    When the following request is received:
      """
      GET /${{ id }}.48x48.jpeg HTTP/1.1
      host: nex.toa.io
      """
    Then the stream equals to `lenna.48x48.jpeg` is sent with the following headers:
      """
      200 OK
      content-type: image/jpeg
      """
    When the following request is received:
      """
      GET /${{ id }}.icon.jpeg HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: image/jpeg
      """

  Scenario: Upload a video
    When the stream of `plank.mp4` is received with the following headers:
      """
      POST /video/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: video/mp4
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """

    # initially Cloudinary returns a chunked response
    When the following request is received:
      """
      GET /video/${{ id }}.mp4 HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      transfer-encoding: chunked
      content-type: video/mp4
      """

    # after a while, Cloudinary returns a content-length response
    When the following request is received:
      """
      GET /video/${{ id }}.mp4 HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: video/mp4
      content-length: 175043
      """

    When the following request is received:
      """
      GET /video/${{ id }}.200x200.mp4 HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      transfer-encoding: chunked
      content-type: video/mp4
      """

    When the following request is received:
      """
      HEAD /video/${{ id }}.200x200.mp4 HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: video/mp4
      """

  Scenario: Range headers and gif support
    When the stream of `plank.mp4` is received with the following headers:
      """
      POST /video/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: video/mp4
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """

    When the following request is received:
      """
      GET /video/${{ id }}.mp4 HTTP/1.1
      user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15
      host: nex.toa.io
      range: bytes=0-1
      """

    Then the following reply is sent:
      """
      206 Partial Content
      content-type: video/mp4
      content-length: 2
      """

    # gif
    When the following request is received:
      """
      GET /video/${{ id }}.200x200.gif HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: image/gif
      """
