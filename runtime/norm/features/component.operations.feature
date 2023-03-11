Feature: Operations declaration

  Scenario Outline: Operation <channel> entity references

  Operation IO schemas may reference entity's properties using syntax:
  - `.` - entity's property with the same name
  - '.foo` - entity's property with `foo` name

    Given I have an entity schema:
      """
      foo: string
      bar: 1
      """
    When I declare assignment with:
      """
      <channel>:
        foo: .
        baz: .bar
      """
    Then normalized assignment declaration must contain:
      """
      <channel>:
        type: object
        properties:
          foo:
            type: string
          baz:
            type: number
            default: 1
      """

    Examples:
      | channel |
      | input   |
      | output  |

  Scenario: Prototype property reference

  Operation IO schemas must be able to reference prototype's entity properties.

    When I declare assignment with:
      """
      output:
        id: .
      """

    Then normalized assignment declaration must contain:
      """
      output:
        type: object
        properties:
          id:
            $ref: https://schemas.toa.io/0.0.0/definitions#/definitions/id
      """
