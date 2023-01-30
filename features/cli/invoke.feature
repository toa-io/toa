Feature: Invoke operation

  Scenario Outline: Invoke <syntax> operation which uses context
    Given I have a component `node.syntaxes`
    And my working directory is ./components/node.syntaxes
    When I run `toa invoke <syntax>`
    Then stderr should be empty
    And stdout should contain lines:
    """
    { output: { foo: 'bar' } }
    """
    Examples:
      | syntax   |
      | function |
      | class    |
      | factory  |
