Feature: Annotation

  Scenario: Simple annotation
    Given the annotation:
      """yaml
      /:
        anonymous: true
        /foo:
          GET:
            endpoint: pots.enumerate
      """
    And the `pots` is running
    And the `pots` database contains:
      | _id                              | title     | volume |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot | 100    |
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - id: 4c4759e6f9c74da989d64511df42d6f4
        title: First pot
        volume: 100
      """
