Feature: Objects

  Scenario Outline: Map<<type>>
    When I write schema:
      """yaml
      <<type>>
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^.+$":
          type: <type>
      """
    Examples:
      | type    |
      | string  |
      | number  |
      | boolean |

