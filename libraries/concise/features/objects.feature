Feature: Objects

  Scenario: Map
    When I write schema:
      """yaml
      <string>
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^.+$":
          type: string
      """
