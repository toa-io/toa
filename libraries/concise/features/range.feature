Feature: Numric ranges

  Scenario: Numeric range <range>
    When I write schema:
      """yaml
      integer[0, 7]
      """
    Then it is equivalent to:
      """yaml
      type: integer
      minimum: 0
      maximum: 7
      """

  Scenario: Numeric range <range> exclusive
    When I write schema:
      """yaml
      number(0, 7]
      """
    Then it is equivalent to:
      """yaml
      type: number
      exclusiveMinimum: 0
      maximum: 7
      """

  Scenario: Half-open number range
    When I write schema:
      """yaml
      integer(, 10)
      """
    Then it is equivalent to:
      """yaml
      type: integer
      exclusiveMaximum: 10
      """
