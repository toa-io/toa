Feature: Entity timestamp

  Scenario: Last-Modified
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
      last-modified: #{{ utc | set created }}

      id: ${{ id }}
      """
    When the following request is received:
      """
      HEAD /pots/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      last-modified: ${{ created }}
      content-length: 149
      """
