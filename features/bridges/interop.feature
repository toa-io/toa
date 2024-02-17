Feature: Language interoperability

  Scenario Outline: Calling bash from js
    Given I compose `interop.demo` component
    When I call `interop.demo.greet` with:
      """
      input:
        name: Jenny
        language: <language>
      """
    Then the reply is received:
      """
      <greeting>, Jenny!
      """
    Examples:
      | language | greeting |
      | en       | Hello    |
      | fr       | Bonjour  |
