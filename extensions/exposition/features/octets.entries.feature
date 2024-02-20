Feature: Accessing entires

  Scenario: Accessing entries
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store: ~
        GET:
          octets:list:
            meta: true
        /*:
          GET:
            octets:fetch:
              meta: true
      """
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
      GET / HTTP/1.1
      accept: application/vnd.toa.octets.entries+yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - id: 10cf16b458f759e0d617f2f3d83599ff
        size: 8169
        type: application/octet-stream
      - id: 814a0034f5549e957ee61360d87457e5
        size: 473831
        type: image/png
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      accept: application/vnd.toa.octets.entry+yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      content-length: 124

      id: 10cf16b458f759e0d617f2f3d83599ff
      type: application/octet-stream
      size: 8169
      """
