Feature: Octets directive family

  Background:
    Given the annotation:
      """yaml
      /:
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
      """
    When the stream of `lenna.ascii` is received in the request:
      """
      POST / HTTP/1.1
      accept: application/yaml
      content-type: application/octet-stream
      """

  Scenario: Storing an entry
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
    Then the stream equals to `lenna.ascii` is received in the reply:
      """
      200 OK
      content-type: application/octet-stream
      content-length: 8169
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
    And the stream of `lenna.png` is received in the request:
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

  Scenario: Fetching non-existent BLOB
    When the following request is received:
      """
      GET /non-existent HTTP/1.1
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
