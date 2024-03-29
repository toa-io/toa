Feature: Octets directive family

  Background:
    Given the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store: ~
        GET:
          octets:list: ~
        PUT:
          octets:permute: ~
        /*:
          GET:
            octets:fetch: ~
          DELETE:
            octets:delete: ~
        /media:
          /jpeg:
            POST:
              octets:store:
                accept: image/jpeg
          /jpeg-or-png:
            POST:
              octets:store:
                accept:
                  - image/jpeg
                  - image/png
          /images:
            POST:
              octets:store:
                accept: image/*
            /*:
              GET:
                octets:fetch: ~
      """

  Scenario: Basic storage operations
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      accept: application/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      id: 10cf16b458f759e0d617f2f3d83599ff
      type: application/octet-stream
      size: 8169
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      """
    Then the stream equals to `lenna.ascii` is sent with the following headers:
      """
      200 OK
      content-type: application/octet-stream
      content-length: 8169
      etag: ${{ ETAG }}
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      if-none-match: ${{ ETAG }}
      """
    Then the following reply is sent:
      """
      304 Not Modified
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - 10cf16b458f759e0d617f2f3d83599ff
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff?foo=bar HTTP/1.1
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      DELETE /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Entries permutation
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      accept: application/yaml
      content-type: application/octet-stream
      """
    And the stream of `lenna.png` is received with the following headers:
      """
      POST / HTTP/1.1
      accept: application/yaml
      content-type: application/octet-stream
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - 10cf16b458f759e0d617f2f3d83599ff
      - 814a0034f5549e957ee61360d87457e5
      """
    When the following request is received:
      """
      PUT / HTTP/1.1
      content-type: application/yaml

      - 814a0034f5549e957ee61360d87457e5
      - 10cf16b458f759e0d617f2f3d83599ff
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - 814a0034f5549e957ee61360d87457e5
      - 10cf16b458f759e0d617f2f3d83599ff
      """

  Scenario: Media type control
    When the stream of `lenna.png` is received with the following headers:
      """
      POST /media/jpeg-or-png/ HTTP/1.1
      content-type: image/jpeg
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """
    When the stream of `lenna.png` is received with the following headers:
      """
      POST /media/jpeg/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      415 Unsupported Media Type
      """
    When the stream of `lenna.png` is received with the following headers:
      """
      POST /media/jpeg-or-png/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      201 Created
      """

  Scenario Outline: Detecting `<type>`
    When the stream of `sample.<ext>` is received with the following headers:
      """
      POST /media/images/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      type: <type>
      """
    Examples:
      | ext  | type       |
      | jpeg | image/jpeg |
      | jxl  | image/jxl  |
      | gif  | image/gif  |
      | heic | image/heic |
      | avif | image/avif |
      | webp | image/webp |

  Scenario: Accepting `image/svg+xml`
    When the stream of `sample.svg` is received with the following headers:
      """
      POST /media/images/ HTTP/1.1
      content-type: image/svg+xml
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      type: image/svg+xml
      """

  Scenario: Fetching non-existent BLOB
    When the following request is received:
      """
      GET /whatever HTTP/1.1
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Fetching a BLOB with trailing slash
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      accept: application/yaml
      content-type: application/octet-stream
      """
    And the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff/ HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      404 Not Found
      content-type: text/plain

      Trailing slash is redundant.
      """

  Scenario: Original BLOB is not accessible
    Given the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store: ~
        /*:
          GET:
            octets:fetch:
              meta: true
              blob: false
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      403 Forbidden

      BLOB variant must be specified.
      """
