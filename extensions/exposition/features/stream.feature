Feature: Streamed request body

  `map:stream` hands the request body to the operation as the stream it takes, instead of
  reading it. See /documentation/streams.md.

  Scenario: Handing the body to an operation as a stream
    Given the `streams` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST:
            map:stream: content
            endpoint: take
      """
    When the following request is received:
      """
      POST /streams/ HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      accept: application/yaml

      hello
      """
    Then the following reply is sent:
      """
      201 Created

      size: 5
      type: application/octet-stream
      """

  Scenario: Answering bytes in the media type the client asked for
    Given the `streams` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST:
            map:stream:
              property: content
              produces: [image/png, video/mp4]
            endpoint: answer
      """
    When the following request is received:
      """
      POST /streams/ HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      accept: video/mp4

      hello
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: video/mp4

      hello
      """

  Scenario: A client asking for what the route does not produce
    Given the `streams` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            map:stream:
              property: content
              produces: [image/png]
            endpoint: answer
      """
    When the following request is received:
      """
      POST /streams/ HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      accept: video/mp4

      hello
      """
    Then the following reply is sent:
      """
      406 Not Acceptable
      """

  Scenario: A media type the route does not take
    Given the `streams` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            map:stream:
              property: content
              accept: [image/png]
            endpoint: take
      """
    When the following request is received:
      """
      POST /streams/ HTTP/1.1
      host: nex.toa.io
      content-type: text/plain

      hello
      """
    Then the following reply is sent:
      """
      415 Unsupported Media Type
      """

  Scenario: A body past what the route takes
    Given the `streams` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            map:stream:
              property: content
              limit: 2b
            endpoint: take
      """
    When the following request is received:
      """
      POST /streams/ HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream

      hello
      """
    Then the following reply is sent:
      """
      413 Request Entity Too Large
      """

  Scenario: A route that answers bytes answered with a value
    Given the `streams` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST:
            map:stream:
              property: content
              produces: [video/mp4]
            endpoint: take
      """
    When the following request is received:
      """
      POST /streams/ HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      accept: video/mp4

      hello
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity
      """
