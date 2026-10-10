Feature: Queries by what a property holds inside

  Background:
    Given the `kettles` database contains:
      | _id                              | title  | size                        |
      | 4c4759e6f9c74da989d64511df42d6f4 | First  | {"volume":1.5,"unit":"cup"} |
      | 99988d785d7d445cad45dbf8531f560b | Second | {"volume":2.5,"unit":"pot"} |
      | a7edded6b2ab47a0aca9508cc4da4138 | Third  | {"volume":3.5,"unit":"pot"} |
    And the `kettles` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            endpoint: enumerate
            query:
              criteria: size.unit==pot;
      """

  Scenario: Request with criteria and sorting on a property inside an object
    When the following request is received:
      """
      GET /kettles/?criteria=size.volume<3.5,size.volume>3&sort=size.volume:desc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - title: Third
        id: a7edded6b2ab47a0aca9508cc4da4138
      - title: Second
        id: 99988d785d7d445cad45dbf8531f560b
      """

  Scenario Outline: Request with <what> that names nothing the entity declares
    When the following request is received:
      """
      GET /kettles/?<query> HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """

    Examples:
      | what     | query                   |
      | criteria | criteria=size.weight>1  |
      | a value  | criteria=size.volume>no |
      | a sort   | sort=size.weight:desc   |
