Feature: IO restrictions

  Background:
    Given the `pots` database contains:
      | _id                              | title      | volume | temperature |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot  | 100    | 80          |
      | 99988d785d7d445cad45dbf8531f560b | Second pot | 200    | 30          |

  Scenario: Output is omitted by default
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET: enumerate
          /:id:
            GET: observe
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      content-length: 0
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-length: 0
      """

  Scenario: Output is omitted by intention
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: false
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
      content-length: 0
      """

  Scenario: Output permissions
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

  Scenario: Input is unrestricted by default
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      accept: application/yaml
      content-type: application/yaml

      title: Hello
      volume: 1.5
      temperature: 80
      """
    Then the following reply is sent:
      """
      201 Created

      title: Hello
      volume: 1.5
      temperature: 80
      """

  Scenario: Input permissions
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:input: [title, volume]
          POST: create
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      accept: text/plain
      content-type: application/yaml

      title: Hello
      volume: 1.5
      temperature: 80
      """
    Then the following reply is sent:
      """
      400 Bad Request

      Unexpected input: temperature
      """
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      content-type: application/yaml

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      """
