Feature: Schema references

  Scenario: Schema reference as property
    When I write schema:
      """yaml
      foo: ref:types/ok
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          $ref: types/ok
      additionalProperties: false
      """

  Scenario: Schema reference as array items
    When I write schema:
      """yaml
      foo: [ref:types/ok]
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: array
          items:
            $ref: types/ok
      additionalProperties: false
      """
