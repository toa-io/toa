Feature: Introspection

  Scenario: Introspect a resource
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: enumerate
          POST: create
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: GET, POST, OPTIONS

      POST:
        input:
          type: object
          properties:
            title:
              type: string
            temperature:
              type: number
            volume:
              type: number
          additionalProperties: false
        output:
          type: object
      GET:
        output:
          type: array
      """
