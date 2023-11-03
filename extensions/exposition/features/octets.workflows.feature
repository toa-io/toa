Feature: Octets storage workflows

  Scenario: Adding metadata to a file
    Given the `octets.meta` is running
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store:
            workflow:
              add-foo: octets.meta.foo
        /*:
          GET:
            octets:fetch:
              meta: true
      """
    When the stream of `lenna.ascii` is received in the request:
      """
      POST / HTTP/1.1
      accept: application/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: multipart/yaml; boundary=cut

      --cut
      id: 10cf16b458f759e0d617f2f3d83599ff
      type: application/octet-stream
      size: 8169
      --cut
      add-foo: null
      --cut--
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff:meta HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      id: 10cf16b458f759e0d617f2f3d83599ff
      type: application/octet-stream
      size: 8169
      meta:
        foo: bar
      """
