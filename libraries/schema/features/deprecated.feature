Feature: Deprecated

  To be removed in further versions.

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

