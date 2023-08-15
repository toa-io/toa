Feature: Queries

  Background:
    Given the Gateway is running
    And the `pots` is running
    And the `pots` database contains:
      | id                               | title      | volume |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot  | 100    |
      | 99988d785d7d445cad45dbf8531f560b | Second pot | 200    |
      | a7edded6b2ab47a0aca9508cc4da4138 | Third pot  | 300    |

  Scenario: Querying by id
    When the following request is received:
      """
      GET /pots?id=a7edded6b2ab47a0aca9508cc4da4138 HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      output:
        - id: a7edded6b2ab47a0aca9508cc4da4138
      """
