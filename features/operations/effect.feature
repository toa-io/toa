Feature: Effect

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | VERSION | CREATED       |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1       | 1716043244316 |

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
      VERSION: 1
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
      VERSION: 1
      """

  Scenario: A deleted entry is not the one an effect gets
    Given the `mongo.one` database contains:
      | _id                              | foo | bar  | VERSION | CREATED       | DELETED       |
      | bcb6780f50e243348cad40ed6b5ef575 | 5   | gone | 1       | 1716043244316 | 1722011755487 |
    And I compose `mongo.one` component
    When I call `mongo.one.ensure` with:
      """yaml
      entity:
        foo: 5
        bar: gone
      """
    Then the reply is received:
      """yaml
      foo: 5
      bar: gone
      VERSION: 1
      """
    When I call `mongo.one.observe` with:
      """yaml
      query:
        criteria: bar==gone
      """
    Then the reply is received:
      """yaml
      foo: 5
      bar: gone
      DELETED: null
      """

  Scenario: A deleted entry is the one an effect gets where the query asks for the deleted
    Given the `mongo.one` database contains:
      | _id                              | foo | bar  | VERSION | CREATED       | DELETED       |
      | bcb6780f50e243348cad40ed6b5ef575 | 5   | gone | 1       | 1716043244316 | 1722011755487 |
    And I compose `mongo.one` component
    When I call `mongo.one.ensure` with:
      """yaml
      query:
        criteria: bar==gone
        deleted: true
      entity:
        foo: 5
        bar: gone
      """
    Then the reply is received:
      """yaml
      id: bcb6780f50e243348cad40ed6b5ef575
      foo: 5
      bar: gone
      """
