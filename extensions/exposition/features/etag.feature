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

  Scenario: Using etag with enumeration
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: enumerate
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "${{ etag }}"
      """
    # the same representation must be asked for, the tag identifies it
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      if-none-match: "${{ etag }}"
      """
    Then the following reply is sent:
      """
      304 Not Modified
      etag: "${{ etag }}"
      """

  Scenario: `etag` of a reply that carries no version
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:name:
          io:output: true
          GET: compute
      """
    When the following request is received:
      """
      GET /echo/Bob/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "2d6a12ffc0a952fbd09f8909de4e0e4b20ba2b906cd12ac22bbef4ee5bd9003e"

      Hello Bob
      """
    When the following request is received:
      """
      GET /echo/Bob/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      if-none-match: "2d6a12ffc0a952fbd09f8909de4e0e4b20ba2b906cd12ac22bbef4ee5bd9003e"
      """
    Then the following reply is sent:
      """
      304 Not Modified
      etag: "2d6a12ffc0a952fbd09f8909de4e0e4b20ba2b906cd12ac22bbef4ee5bd9003e"
      """
    # the tag identifies the representation, which is what `vary: accept` says
    When the following request is received:
      """
      GET /echo/Bob/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      if-none-match: "2d6a12ffc0a952fbd09f8909de4e0e4b20ba2b906cd12ac22bbef4ee5bd9003e"
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "360c52c694c418b4a793a4815e611206ab17fe04836351a65638a15d1491810b"
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

  Scenario: Hash `if-none-match` on versioned resource
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
          /:id:
            GET: observe
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
      if-none-match: "ef4a2abb4c896c06d0ab3037427e6c7c3e9a32a0c982eee2df68679babd96da3"
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "1"
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
