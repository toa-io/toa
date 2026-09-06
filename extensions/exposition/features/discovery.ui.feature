Feature: The discovery page

  The page that reads the tree, served from the same origin the tree is. The scenarios are
  about the server rather than the page: it is pointed at a fixture, so none of them needs
  a UI build.

  Scenario: The page
    When the following request is received:
      """
      GET /.discovery/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      cache-control: no-cache
      content-type: text/html; charset=utf-8

      the page
      """

  Scenario: The bare path is the directory it is
    When the following request is received:
      """
      GET /.discovery HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      302 Moved Temporarily
      location: /.discovery/
      """

  Scenario: An asset carries the build it was named for
    When the following request is received:
      """
      GET /.discovery/_app/immutable/asset.js HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      cache-control: public, max-age=31536000, immutable
      content-type: text/javascript; charset=utf-8
      """

  Scenario: Anything that could be a route is the page
    The client router knows what routes there are, and this server does not.

    When the following request is received:
      """
      GET /.discovery/pots/:id HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/html; charset=utf-8

      the page
      """

  Scenario: An asset that is not there is not there
    When the following request is received:
      """
      GET /.discovery/_app/immutable/gone.js HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: A path that merely starts like this one is not this one
    When the following request is received:
      """
      GET /.discoveryable/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: A path that climbs out of the page is refused
    An encoded separator is what reaches here: a dot segment is collapsed while the URL is
    parsed, and `%2f` survives that to decode into one afterwards.

    When the following request is received:
      """
      GET /.discovery/%2f%2e%2e%2f%2e%2e%2fpackage.json HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: The page is served before a credential is read
    A page is public, and one served after `auth` would refuse the client holding a stale
    token — who is the client most likely to have opened it.

    Given the annotation:
      """yaml
      /:
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /.discovery/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK

      the page
      """

  Scenario: What else the path answers
    When the following request is received:
      """
      POST /.discovery/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      405 Method Not Allowed
      allow: GET, HEAD, OPTIONS
      """

