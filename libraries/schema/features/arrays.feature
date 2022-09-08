Feature: Arrays

  Scenario: One of number constants
    When I write schema:
      """yaml
      foo: [1, 2, 3]
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: number
          enum:
            - 1
            - 2
            - 3
      additionalProperties: false
      """

  Scenario: One of string constants
    When I write schema:
      """yaml
      foo: [bar, baz]
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: string
          enum:
            - bar
            - baz
      additionalProperties: false
      """

  Scenario Outline: Array of <type> primitives
    When I write schema:
        """yaml
        foo: [<type>]
        """
    Then it is equivalent to:
        """yaml
        type: object
        properties:
          foo:
            type: array
            items:
              type: <type>
      additionalProperties: false
        """
    Examples:
      | type    |
      | string  |
      | number  |
      | integer |
      | boolean |

  Scenario: Array of concise objects
    When I write schema:
      """yaml
      foo:
        - foo: number
          bar: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: array
          items:
            type: object
            properties:
              foo:
                type: number
              bar:
                type: string
            additionalProperties: false
      additionalProperties: false
      """
