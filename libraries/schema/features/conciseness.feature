Feature: Concise JSON Schema syntax

  Scenario Outline: <type>

    Given I have a schema:
      """
      <type>
      """
    And that schema is equivalent to:
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

    Given I have a schema:
      """
      foo:
        type: string
      """
    And that schema is equivalent to:
      """
      type: object
      properties:
        foo:
          type: string
      """

  Scenario: Concise object properties

    Given I have a schema:
      """
      foo: string
      bar: boolean
      """
    And that schema is equivalent to:
      """
      type: object
      properties:
        foo:
          type: string
        bar:
          type: boolean
      """

  Scenario Outline: <type> default

    Given I have a schema:
      """
      foo: <value>
      """
    And that schema is equivalent to:
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

    Given I have a schema:
      """
      foo*: 1
      bar: string
      """
    And that schema is equivalent to:
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

    Given I have a schema:
      """
      foo: [1, 2, 3]
      """
    And that schema is equivalent to:
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

    Given I have a schema:
      """
      foo: [bar, baz]
      """
    And that schema is equivalent to:
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

    Given I have a schema:
        """
        foo: [<type>]
        """
    And that schema is equivalent to:
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
