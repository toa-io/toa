Feature: Custom Entity id

  Scenario: Getting a default value
    Given I compose `custom.id` component
    When I call `custom.id.observe` with:
      """yaml
      query:
        id: 1
      """
    Then the reply is received:
      """yaml
      id: 1
      value: hello
      _version: 0
      """

  Scenario: Creating an Entity instance with custom id
    Given I compose `custom.id` component
    When I call `custom.id.transit` with:
      """yaml
      query:
        id: 2
      input:
        value: bye
      """
    Then the reply is received:
      """yaml
      id: 2
      """
    When I call `custom.id.observe` with:
      """yaml
      query:
        id: 2
      """
    Then the reply is received:
      """yaml
      id: 2
      value: bye
      _version: 1
      """
