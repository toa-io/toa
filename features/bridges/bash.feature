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
    When I invoke `hi`
    Then the reply is received:
      """
      Hi!
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

  Scenario: A bash operation sees none of the runtime's variables
    Given an environment variable `TOA_CONFIGURATION__SECRET_C` is set to 'hidden'
    And I boot `bash.dummy` component
    When I invoke `env`
    Then the reply is received:
      """
      ""
      """
