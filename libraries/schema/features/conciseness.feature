Feature: Concise JSON Schema syntax

  Scenario Outline: <type>

    When I write schema:
      """
      <type>
      """
    Then it is equivalent to:
      """
      type: "<type>"
      """

    Examples:
      | type    |
      | string  |
      | number  |
      | integer |
      | boolean |
      | object  |
      | array   |
      | null    |

  Scenario: Object properties

    When I write schema:
      """
      foo:
        type: string
      """
    Then it is equivalent to:
      """
      type: object
      properties:
        foo:
          type: string
      """

  Scenario: Concise object properties

    When I write schema:
      """
      foo: string
      bar: boolean
      """
    Then it is equivalent to:
      """
      type: object
      properties:
        foo:
          type: string
        bar:
          type: boolean
      """

  Scenario Outline: <type> default

    When I write schema:
      """
      foo: <value>
      """
    Then it is equivalent to:
      """
      type: object
      properties:
        foo:
          type: <type>
          default: <value>
      """

    Examples:
      | value     | type    |
      | something | string  |
      | 1         | number  |
      | 1.0       | number  |
      | true      | boolean |

  Scenario: Required properties

    When I write schema:
      """
      foo*: 1
      bar: string
      """
    Then it is equivalent to:
      """
      type: object
      properties:
        foo:
          type: number
          default: 1
        bar:
          type: string
      required: [foo]
      """

  Scenario: One of listed number constants

    When I write schema:
      """
      foo: [1, 2, 3]
      """
    Then it is equivalent to:
      """
      type: object
      properties:
        foo:
          type: number
          oneOf:
            - const: 1
            - const: 2
            - const: 3
      """

  Scenario: One of listed string constants

    When I write schema:
      """
      foo: [bar, baz]
      """
    Then it is equivalent to:
      """
      type: object
      properties:
        foo:
          type: string
          oneOf:
            - const: bar
            - const: baz
      """

  Scenario Outline: Array of <type>s

    When I write schema:
        """
        foo: [<type>]
        """
    Then it is equivalent to:
        """
        type: object
        properties:
          foo:
            type: array
            items:
              type: <type>
        """

    Examples:
      | type    |
      | string  |
      | number  |
      | integer |
      | boolean |
      | object  |
