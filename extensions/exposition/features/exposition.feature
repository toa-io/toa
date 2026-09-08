Feature: `exposition` response header

  What answered, on every reply: the build of the gateway, and the context and environment it
  was deployed with. Under a name of its own rather than `server`, which a CDN in front takes
  for itself — so a gateway that said it there said it to nobody.

  Scenario: `exposition` response header
    Given the annotation:
      """yaml
      /:
        GET:
          anonymous: true
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      exposition: ${{ version }}
      """

  Scenario: The tree is signed too
    The discovery page prints what answered it, and this is where it reads that from.

    Given the annotation:
      """yaml
      /:
        GET:
          anonymous: true
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      OPTIONS /.discovery HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      exposition: ${{ version }}
      """
