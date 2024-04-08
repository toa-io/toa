Feature: Options

  Scenario: Getting options
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          POST: create
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      POST:
        input:
          type: object
          properties:
            name:
              type: string
              description: The name of the pot
            description:
              type: string
              description: A description of the pot
        output:
          type: object
          properties:
            id:
              type: string
              description: The id of the pot
        unprocessable:
          - INVALID_NAME
          - INVALID_DESCRIPTION
      """
