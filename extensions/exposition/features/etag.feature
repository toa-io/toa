Feature: Optimistic concurrency control

  Scenario: Using `etag`
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
          /:id:
            GET: observe
            PUT: transit
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      etag: "1"

      id: ${{ id }}
      """
    When the following request is received:
      """
      GET /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "1"
      """
    When the following request is received:
      """
      GET /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      if-none-match: "1"
      """
    Then the following reply is sent:
      """
      304 Not Modified
      etag: "1"
      """
    When the following request is received:
      """
      PUT /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      if-match: "38"

      volume: 2.5
      """
    Then the following reply is sent:
      """
      412 Precondition Failed
      """
    When the following request is received:
      """
      PUT /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      if-match: "1"

      volume: 2.5
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "2"
      """

  Scenario: Weak `etag`
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
          /:id:
            GET: observe
            PUT: transit
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      etag: "1"

      id: ${{ id }}
      """
    When the following request is received:
      """
      GET /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "1"
      """
    When the following request is received:
      """
      GET /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      if-none-match: W/"1"
      """
    Then the following reply is sent:
      """
      304 Not Modified
      etag: W/"1"
      """
    When the following request is received:
      """
      PUT /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      if-match: W/"38"

      volume: 2.5
      """
    Then the following reply is sent:
      """
      412 Precondition Failed
      """
    When the following request is received:
      """
      PUT /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      if-match: W/"1"

      volume: 2.5
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "2"
      """

  Scenario: Unexpected `if-match` format
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          /:id:
            PUT: transit
      """
    When the following request is received:
      """
      PUT /pots/fa177da8393544139915795816ad6b97/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      content-type: application/yaml
      if-match: "oopsie"

      volume: 2.5
      """
    Then the following reply is sent:
      """
      400 Bad Request

      Invalid ETag
      """

  Scenario: Etag with non-queryable operation
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:foo/:id:
          GET:
            io:output: true
            map:headers:
              name: if-match
            endpoint: affect
      """
    When the following request is received:
      """
      GET /echo/foo/Bob/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      if-match: "1"
      """
    Then the following reply is sent:
      """
      200 OK

      Hello "1"
      """
