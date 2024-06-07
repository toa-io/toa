Feature: Tasks

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1        |

  Scenario: Sending a task
    Given I compose `mongo.one` component
    When I call `mongo.one.assign` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        bar: bye
      task: true
      """
    Then the reply is received:
      """yaml
      null
      """
    Then I call `mongo.one.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 0
      bar: bye
      _version: 2
      """
