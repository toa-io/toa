Feature: A reply the component encoded

  A component answering over the broker encodes a JSON reply for the gateway, which writes those
  bytes as they arrived. Every scenario here runs the call through the broker, which is the only
  place those bytes exist.

  Background:
    Given the components answer over the broker
    And the `pots` database contains:
      | _id                              | title      | volume | temperature |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot  | 100    | 80          |
      | 99988d785d7d445cad45dbf8531f560b | Second pot | 200    | 30          |

  Scenario: A JSON reply is answered as the component encoded it
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, title, volume]
          GET: enumerate
          /:id:
            GET: observe
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/json

      {"title":"First pot","volume":100,"id":"4c4759e6f9c74da989d64511df42d6f4"}
      """
    And the reply does not contain:
      """
      temperature
      """
    When the following request is received:
      """
      GET /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    Then the following reply is sent:
      """
      200 OK

      [{"title":"First pot","volume":100,"id":"4c4759e6f9c74da989d64511df42d6f4"},{"title":"Second pot","volume":200,"id":"99988d785d7d445cad45dbf8531f560b"}]
      """

  Scenario: A reply a client asks for in another format
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, title]
          /:id:
            GET: observe
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      title: First pot
      id: 4c4759e6f9c74da989d64511df42d6f4
      """

  # a directive that takes a property out of the reply reads it, so the component answers values
  Scenario: A reply a directive reads
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, title, volume]
          /:id:
            GET:
              io:status: volume
              endpoint: observe
      """
    When the following request is received:
      """
      GET /pots/99988d785d7d445cad45dbf8531f560b/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    Then the following reply is sent:
      """
      200 OK

      {"title":"Second pot","id":"99988d785d7d445cad45dbf8531f560b"}
      """

  Scenario: A reply the client already holds
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, title]
          /:id:
            GET: observe
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    Then the following reply is sent:
      """
      200 OK
      etag: "${{ tag }}"
      """
    When the following request is received:
      """
      GET /pots/4c4759e6f9c74da989d64511df42d6f4/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      if-none-match: "${{ tag }}"
      """
    Then the following reply is sent:
      """
      304 Not Modified
      """
