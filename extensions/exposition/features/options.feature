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

      GET:
        type: array
        items:
          type: object
          properties:
            id:
              type: string
              pattern: ^[a-fA-F0-9]{32}$
            title:
              type: string
              maxLength: 64
            volume:
              type: number
              exclusiveMinimum: 0
              maximum: 1000
            temperature:
              type: number
              exclusiveMinimum: 0
              maximum: 300
          additionalProperties: false
          required:
            - id
            - title
            - volume
      POST:
        input:
          type: object
          properties:
            title:
              type: string
              maxLength: 64
            temperature:
              type: number
              exclusiveMinimum: 0
              maximum: 300
            volume:
              type: number
              exclusiveMinimum: 0
              maximum: 1000
          additionalProperties: false
          required:
            - title
            - volume
        output:
          type: object
          properties:
            id:
              type: string
              pattern: ^[a-fA-F0-9]{32}$
          additionalProperties: false
      """
