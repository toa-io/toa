Feature: Concise Object Schema

  Scenario: Concise object declaration
    When I write schema:
      """yaml
      foo: string
      bar: boolean
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: string
        bar:
          type: boolean
      additionalProperties: false
      """

  Scenario: Required object properties
    When I write schema:
      """yaml
      foo*: 1
      bar: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: number
          default: 1
        bar:
          type: string
      required: [foo]
      additionalProperties: false
      """

  Scenario: Additional properties

  Additional properties are not allowed by default

    When I write schema:
      """yaml
      foo: string
      ...: ~
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: string
      additionalProperties: true
      """

  Scenario: Pattern properties
    When I write schema:
      """yaml
      /^str_*+$/: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^str_*+$":
          type: string
      additionalProperties: false
      """

  Scenario: Wildcard property
    When I write schema:
      """yaml
      ~: number
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^.*$":
          type: number
      additionalProperties: false
      """

  Scenario: String pattern
    When I write schema:
      """yaml
      foo: /^foo_/
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: string
          pattern: "^foo_"
      additionalProperties: false
      """

  Scenario: No schema
    When I write schema:
      """yaml
      null
      """
    Then it is equivalent to:
      """yaml
      {}
      """

  Scenario Outline: Default value of <type> type
    When I write schema:
      """yaml
      <value>
      """
    Then it is equivalent to:
      """yaml
      type: <type>
      default: <value>
      """
    Examples:
      | value     | type    |
      | something | string  |
      | 1         | number  |
      | 1.0       | number  |
      | true      | boolean |

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
          oneOf:
            - const: 1
            - const: 2
            - const: 3
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
          oneOf:
            - const: bar
            - const: baz
      additionalProperties: false
      """

  Scenario Outline: Primitive <type> type
    When I write schema:
      """yaml
      <type>
      """
    Then it is equivalent to:
      """yaml
      type: "<type>"
      """
    Examples:
      | type    |
      | string  |
      | number  |
      | integer |
      | boolean |
      | array   |
      | object  |

  Scenario: String constant
    When I write schema:
      """yaml
      foo: [bar]
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: string
          oneOf:
            - const: bar
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
        type: array
        items:
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
              bar:
                type: string
            additionalProperties: false
      additionalProperties: false
      """

  Scenario: Custom `id` shortcut
    When I write schema:
      """yaml
      foo: id
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          $ref: https://schemas.toa.io/0.0.0/definitions#/definitions/id
      additionalProperties: false
      """

  Scenario: Property as known keyword
    When I write schema:
      """yaml
      title: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        title:
          type: string
      additionalProperties: false
      """
