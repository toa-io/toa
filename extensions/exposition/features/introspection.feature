Feature: Introspection

  Scenario: Resource introspection
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
      Allow: GET, POST

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
        errors:
          - NO_WAY
          - WONT_CREATE
      """

  Scenario: Introspection with route parameters
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:a:
          io:output: true
          PATCH: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/:a/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: PATCH

      PATCH:
        route:
          a:
            type: string
        input:
          type: object
          properties:
            b:
              type: string
        output:
          type: object
          properties:
            a:
              type: string
            b:
              type: string
      """

  Scenario: Introspection with query parameters
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          PATCH:
            query:
              parameters: [a]
            endpoint: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: PATCH

      PATCH:
        query:
          a:
            type: string
        input:
          type: object
          properties:
            b:
              type: string
        output:
          type: object
          properties:
            a:
              type: string
            b:
              type: string
      """
