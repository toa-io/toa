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
              - add-foo: octets.meta.foo
                add-bar: octets.meta.bar
              - add-baz: octets.meta.baz

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
      --cut
      add-bar:
        bar: baz
      --cut
      add-baz: null
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
        bar: baz
        baz: qux
      """

  Scenario: Getting error when adding metadata to a file
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
              add-bar: octets.meta.err
              add-baz: octets.meta.baz
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
      --cut
      error:
        step: add-bar
        code: ERROR
        message: Something went wrong
      --cut--
      """
