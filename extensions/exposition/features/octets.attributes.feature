Feature: Octets `content-attributes` header

  Scenario: Sending `content-attributes` header
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: octets
        /*:
          POST:
            octets:put: ~
          /*:
            GET:
              octets:get:
                meta: true
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST /attributes-header/ HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      content-attributes: foo, bar=baz=1
      content-attributes: baz=1
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      GET /attributes-header/10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      host: nex.toa.io
      accept: application/vnd.toa.octets.entry+yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 10cf16b458f759e0d617f2f3d83599ff
      type: application/octet-stream
      size: 8169
      checksum: 10cf16b458f759e0d617f2f3d83599ff
      attributes:
        foo: 'true'
        bar: baz=1
        baz: '1'
      """

  Scenario: CORS allows `content-attributes` header
    Given the annotation:
      """yaml
      /:
        octets:context: octets
        POST:
          octets:put: ~
      """
    When the following request is received:
      """
      OPTIONS / HTTP/1.1
      host: nex.toa.io
      origin: https://example.com
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-origin: https://example.com
      access-control-allow-headers: accept, authorization, content-type, etag, if-match, if-none-match, content-attributes
      """
