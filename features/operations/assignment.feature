Feature: Assignment

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1        |
      | 4344518184ad44228baffce7a44fd0b1 | 1   | world | 1        |

  Scenario: Assignment returns new state
    Given I compose `mongo.one` component
    When I call `mongo.one.assign` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        bar: bye
      """
    Then the reply is received:
      """
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 0
      bar: bye
      _version: 2
      """
