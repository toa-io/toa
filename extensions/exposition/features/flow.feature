Feature: Request flow

  Scenario: Fetching url
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        octets:context: octets
        /:type:
          GET:
            anonymous: true
            io:output: true
            flow:fetch: octets.tester.redirect
      """
    When the following request is received:
      """
      GET /rfc HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain

      Faster Than Light Speed Protocol (FLIP)
      """
    When the following request is received:
      """
      GET /img HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: image/svg+xml
      """
    When the following request is received:
      """
      GET /err HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
