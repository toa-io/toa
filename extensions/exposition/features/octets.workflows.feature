Feature: Octets storage workflows

  Scenario: Running a workflow
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store:
            workflow:
              - add-foo: octets.tester.foo
                add-bar: octets.tester.bar
              - add-baz: octets.tester.baz
              - diversify: octets.tester.diversify
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
      --cut
      diversify: null
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
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff.hello.png HTTP/1.1
      """
    Then the stream equals to `lenna.png` is sent with the following headers:
      """
      200 OK
      content-type: image/png
      content-length: 473831
      """

  Scenario: Getting error when adding metadata to a file
    Given the `octets.tester` is running
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store:
            workflow:
              add-foo: octets.tester.foo
              add-bar: octets.tester.err
              add-baz: octets.tester.baz
      """
    When the stream of `lenna.ascii` is received with the following headers:
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

  Scenario: Running a workflow on `delete`
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store: ~
        /*:
          GET:
            octets:fetch: ~
          DELETE:
            octets:delete:
              workflow:
                echo: octets.tester.echo
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      DELETE /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      202 Accepted
      content-type: multipart/yaml; boundary=cut

      --cut
      echo: 10cf16b458f759e0d617f2f3d83599ff
      --cut--
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Error in the workflow on `delete`
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store: ~
        /*:
          GET:
            octets:fetch: ~
          DELETE:
            octets:delete:
              workflow:
                err: octets.tester.err
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      DELETE /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      202 Accepted
      content-type: multipart/yaml; boundary=cut

      --cut
      error:
        step: err
        code: ERROR
        message: Something went wrong
      --cut--
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
