Feature: Object properties

  Scenario: Properties declaration
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

  Scenario: Required properties

  By default all object properties are optional, unless they are marked as required.

    When I write schema:
      """yaml
      foo*: number
      bar: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: number
        bar:
          type: string
      required: [foo]
      additionalProperties: false
      """

  Scenario: Optional properties

  If at least one of the properties is explicitly marked as optional, then non-marked
  properties are considered to be required.

    When I write schema:
      """yaml
      foo: 1
      bar?: string
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

  Scenario: Wildcard complex property
    When I write schema:
      """yaml
      ~:
        type: string
        format: uri
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^.*$":
          type: string
          format: uri
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
