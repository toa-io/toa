Feature: A component written in TypeScript

  Node reads a `.ts` operation as it is: it erases the types and compiles nothing, so a
  component runs from what it was written as, with no build step and no loader.

  Scenario Outline: Run a TypeScript <syntax>
    Given an environment variable `TOA_CONFIGURATION_NODE_TYPESCRIPT` is set to '{}'
    And I boot `node.typescript` component
    When I invoke `echo<syntax>` with:
      """yaml
      input: hello
      """
    And I disconnect
    Then the reply is received:
      """
      hellobar
      """
    Examples:
      | syntax   |
      | Function |
      | Class    |
      | Factory  |
