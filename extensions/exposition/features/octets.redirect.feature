Feature: Octets redirection

  Scenario: Redirecting request
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        octets:context: octets
        /re/*:
          GET:
            anonymous: true
            io:output: true
            octets:fetch:
              redirect: octets.tester.redirect
      """
    When the following request is received:
      """
      GET /re/direct HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain

      Faster Than Light Speed Protocol (FLIP)
      """
