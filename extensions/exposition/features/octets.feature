Feature: Octets directive family

  Scenario: Accepting a BLOB
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store: ~

      """
    When the stream of `lenna.ascii` is received with the request:
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
