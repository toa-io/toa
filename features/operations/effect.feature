Feature: Effect

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version | _created      |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1        | 1716043244316 |

  Scenario: Request with entity
    Given I compose `mongo.one` component

    # existing entry
    When I call `mongo.one.ensure` with:
      """yaml
      entity:
        foo: 0
        bar: hello
      """
    Then the reply is received:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 0
      bar: hello
      _version: 1
      """

    # new entry
    When I call `mongo.one.ensure` with:
      """yaml
      entity:
        foo: 1
        bar: world
      """
    Then the reply is received:
      """yaml
      foo: 1
      bar: world
      _version: 1
      """
