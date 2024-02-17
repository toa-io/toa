Feature: Bash bridge

  Scenario: Calling bash operation
    Given I boot `bash.dummy` component
    When I invoke `echo` with:
      """
      input:
        message: hello
      """
    Then the reply is received:
      """
      hello
      """

  Scenario: Bash operation returns error
    Given I boot `bash.dummy` component
    When I invoke `echo` with:
      """
      input:
        code: 1
        message: broken
      """
    Then the error is received:
      """
      message: broken
      """
