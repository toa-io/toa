Feature: IO restrictions

  Background:
    Given the `pots` database contains:
      | _id                              | title      | volume | temperature |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot  | 100    | 80          |
      | 99988d785d7d445cad45dbf8531f560b | Second pot | 200    | 30          |

  Scenario: Output restrictions
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, volume]
          GET: enumerate
          /:id:
            GET: observe
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: 4c4759e6f9c74da989d64511df42d6f4
      volume: 100
      """
    And the reply does not contain:
      """
      title:
      temperature:
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - id: 4c4759e6f9c74da989d64511df42d6f4
        volume: 100
      - id: 99988d785d7d445cad45dbf8531f560b
        volume: 200
      """
    And the reply does not contain:
      """
      title:
      temperature:
      """
