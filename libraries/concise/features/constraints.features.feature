Feature: Type constraints

  Scenario: String length
    When I write schema:
      """yaml
      string(8)
      """
    Then it is equivalent to:
      """yaml
      type: string
      maxLength: 8
      """
