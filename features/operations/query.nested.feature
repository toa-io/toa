Feature: Querying by what a property holds inside

  A selector names a property inside an object by its path, `size.volume`, in criteria, in a
  sort and in a projection.

  Background:
    Given the `mongo.nested` database contains:
      | _id                              | title | size                         | leaves                                                           | ranks | VERSION |
      | a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10 | green | {"volume":1.5,"unit":"cup"}  | [{"origin":"uji","grams":5},{"origin":"yame","grams":2}]          | [1,5] | 1       |
      | b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20 | black | {"volume":2.5,"unit":"pot"}  | [{"origin":"assam","grams":2}]                                   | [7]   | 1       |
      | c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30 | white | {"volume":3.5,"unit":"pot"}  | [{"origin":"fuding","grams":3}]                                  | []    | 1       |
    And I compose `mongo.nested` component

  Scenario: Criteria select on a property inside an object
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        criteria: size.volume>2;size.unit==pot
        sort: [title:asc]
        limit: 10
      """
    Then the reply is received:
      """yaml
      - id: b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      - id: c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30
      """

  Scenario: A value is read as what the property inside holds
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        criteria: size.volume>much
        limit: 10
      """
    Then the following exception is thrown:
      """yaml
      code: 221
      message: "QuerySyntaxException: Criteria selector 'size.volume' takes a number, and 'much' is not one"
      """

  Scenario Outline: A path that names no property is refused
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        criteria: <selector>==1
        limit: 10
      """
    Then the following exception is thrown:
      """yaml
      code: 221
      message: "QuerySyntaxException: Criteria selector '<selector>' is not defined"
      """

    Examples:
      | selector           |
      | size.weight        |
      | size.volume.litres |
      | title.length       |
      | size.constructor   |

  Scenario: Criteria select on a property of the objects an array holds
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        criteria: leaves.grams>=3
        sort: [title:asc]
        limit: 10
      """
    Then the reply is received:
      """yaml
      - id: a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
      - id: c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30
      """

  # each comparison is met by any of the objects, and not by one of them for both
  Scenario: Two comparisons on an array are met by different objects of it
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        criteria: leaves.origin==uji;leaves.grams==2
        limit: 10
      """
    Then the reply is received:
      """yaml
      - id: a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
      """

  Scenario: A value is read as what an array holds
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        criteria: ranks==5
        limit: 10
      """
    Then the reply is received:
      """yaml
      - id: a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
      """

  Scenario: Entries are ordered by a property inside an object
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        sort: [size.volume:desc]
        limit: 10
      """
    Then the reply is received:
      """yaml
      - id: c3c0a0c1a2d34e8f9b7c6d5e4f3a2b30
      - id: b2c0a0c1a2d34e8f9b7c6d5e4f3a2b20
      - id: a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
      """

  Scenario: A sort by a path that names no property is refused
    When I call `mongo.nested.enumerate` with:
      """yaml
      query:
        sort: [size.weight:desc]
        limit: 10
      """
    Then the following exception is thrown:
      """yaml
      code: 221
      message: "QuerySyntaxException: Sort property 'size.weight' is not defined"
      """

  Scenario: An observation reads the property inside an object its projection names
    When I call `mongo.nested.observe` with:
      """yaml
      query:
        id: a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
        projection: [size.unit]
      """
    Then the reply holds `size` as nothing but:
      """yaml
      unit: cup
      """

  Scenario: A projection of a path that names no property is refused
    When I call `mongo.nested.observe` with:
      """yaml
      query:
        id: a1c0a0c1a2d34e8f9b7c6d5e4f3a2b10
        projection: [size.weight]
      """
    Then the following exception is thrown:
      """yaml
      code: 221
      message: "QuerySyntaxException: Projection property 'size.weight' is not defined"
      """

  Scenario: A migration indexes a property inside an object
    Then the `mongo.nested` collection has indexes:
      | name   | keys              | unique | sparse |
      | volume | {"size.volume":1} | false  | false  |
