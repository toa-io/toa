Feature: Queries

  Background:
    Given the `pots` is running
      # See `steps/components/pots`
    And the `pots` database contains:
      | _id                              | title      | volume | temperature |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot  | 100    | 90          |
      | 99988d785d7d445cad45dbf8531f560b | Second pot | 200    | 30          |
      | a7edded6b2ab47a0aca9508cc4da4138 | Third pot  | 300    | 50          |
      | bc6913d317334d76acd07d9f25f73535 | Fourth pot | 400    | 80          |

  Scenario: Request with `id` query parameter
    When the following request is received:
      """
      GET /pots/pot/?id=99988d785d7d445cad45dbf8531f560b HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      output:
        id: 99988d785d7d445cad45dbf8531f560b
        title: Second pot
        volume: 200
      """

  Scenario: Request with query criteria
    When the following request is received:
      """
      GET /pots/?criteria=volume<300&limit=10 HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      output:
        - id: 4c4759e6f9c74da989d64511df42d6f4
          title: First pot
          volume: 100
        - id: 99988d785d7d445cad45dbf8531f560b
          title: Second pot
          volume: 200
      """

  Scenario: Request with `omit` and `limit`
    When the following request is received:
      """
      GET /pots/?omit=1&limit=2 HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      output:
        - id: 99988d785d7d445cad45dbf8531f560b
          title: Second pot
          volume: 200
        - id: a7edded6b2ab47a0aca9508cc4da4138
          title: Third pot
          volume: 300
      """

  Scenario: Request with sorting
    When the following request is received:
      """
      GET /pots/?sort=volume:desc&limit=2 HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      output:
        - id: bc6913d317334d76acd07d9f25f73535
          title: Fourth pot
          volume: 400
        - id: a7edded6b2ab47a0aca9508cc4da4138
          title: Third pot
          volume: 300
      """

  Scenario: Request to a route with a path variable
    When the following request is received:
      """
      GET /pots/99988d785d7d445cad45dbf8531f560b/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      output:
        id: 99988d785d7d445cad45dbf8531f560b
        title: Second pot
        volume: 200
      """

  Scenario: Request to a route with predefined query
    When the following request is received:
      """
      GET /pots/big/?limit=10 HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      output:
        - id: a7edded6b2ab47a0aca9508cc4da4138
          title: Third pot
          volume: 300
        - id: bc6913d317334d76acd07d9f25f73535
          title: Fourth pot
          volume: 400
      """
