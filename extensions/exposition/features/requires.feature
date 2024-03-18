Feature: Request requirements

  Scenario Outline: Required header
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
          /one/:id:
            require:header: if-match
            PUT: transit
          /two/:id:
            require:headers: [if-match]
            PUT: transit
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      content-type: application/yaml
      accept: application/yaml

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      etag: ${{ etag }}

      id: ${{ id }}
      """
    When the following request is received:
      """
      POST /pots/<variant>/${{ id }}/ HTTP/1.1
      content-type: application/yaml
      accept: text/plain

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      400 Bad Request

      'if-match' header is required.
      """
    When the following request is received:
      """
      PUT /pots/${{ id }}/ HTTP/1.1
      content-type: application/yaml
      accept: text/plain
      if-match: ${{ etag }}

      title: Bye
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Examples:
      | variant |
      | one     |
      | two     |
