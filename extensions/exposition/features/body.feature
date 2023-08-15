Feature: Request body

  Background:
    Given the Gateway is running

  Scenario: Creating an entity
    Given the `pots` is running
    When the following request is received:
      """http
      POST /pots HTTP/1.1
      accept: application/yaml
      content-type: application/yaml
      content-length: 23

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """http
      201 Created
      content-type: application/yaml
      content-length: 47

      output:
        id:
      """
