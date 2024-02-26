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
      content-type: application/yaml
      etag: "1"
      """
    When the following request is received:
      """
      PUT /pots/${{ id }}/ HTTP/1.1
      content-type: application/yaml
      if-match: "nope"

      title: Bye
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

      title: Bye
      """
    Then the following reply is sent:
      """
      200 OK
      """
