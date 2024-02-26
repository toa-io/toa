Feature: Optimistic concurrency control

  Scenario: Receiving `etag`
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST: create
          /:id:
            GET: observe
            PUT: transit
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
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
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "1"
      """
    When the following request is received:
      """
      PUT /pots/${{ id }}/ HTTP/1.1
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
      content-type: application/yaml
      if-match: "1"

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
      accept: text/plain
      content-type: application/yaml
      if-match: "oopsie"

      volume: 2.5
      """
    Then the following reply is sent:
      """
      400 Bad Request

      Invalid ETag.
      """
