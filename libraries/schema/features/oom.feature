Feature: One or many

  Scenario: One or many of primitive type
    When I write schema:
      """yaml
      foo+: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          oneOf:
            - type: string
            - type: array
              items:
                type: string
      additionalProperties: false
      """

  Scenario: One or many of object type
    When I write schema:
      """yaml
      foo+:
        foo: string
        bar?: number
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          oneOf:
            - type: object
              properties:
                foo:
                  type: string
                bar:
                  type: number
              required: [foo]
              additionalProperties: false
            - type: array
              items:
                type: object
                properties:
                  foo:
                    type: string
                  bar:
                    type: number
                required: [foo]
                additionalProperties: false
      additionalProperties: false
      """

  Scenario: One or many as pattern property
    When I write schema:
      """yaml
      ~+: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^.*$":
          oneOf:
            - type: string
            - type: array
              items:
                type: string
      additionalProperties: false
      """
