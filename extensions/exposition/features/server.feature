Feature: `Server` response header

  Scenario: `Server` response header
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
      server: Exposition/
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
      server: Exposition/
      """
