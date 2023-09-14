Feature: Request body

  Scenario: Creating an entity
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST: transit
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
