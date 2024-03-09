Feature: Termination

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1        |

  Scenario: Terminating entry
    Given I compose `mongo.one` component
    When I call `mongo.one.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    When I call `mongo.one.terminate` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 0
      bar: hello
      _version: 2
      """
    When I call `mongo.one.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """
      null
      """
    When I call `mongo.one.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        foo: 1
        bar: world
      """
    Then the following exception is thrown:
      """
      code: 302
      """
    When I call `mongo.one.enumerate`
    Then the reply is received:
      """
      []
      """
    When I call `mongo.one.assign` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 0
      bar: hello
      _deleted: null
      _version: 3
      """
    When I call `mongo.one.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
