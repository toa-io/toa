Feature: Dynamic tree updates

  Background:
    Given the `pots` database contains:
      | _id                              | title     | volume | temperature |
      | 4c4759e6f9c74da989d64511df42d6f4 | First pot | 100    | 80          |

  Scenario: Updating routes with conflict
    And the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          GET: observe
      """
    Then the `pots` is stopped
    Then the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          GET: observe
        /big:
          GET:
            endpoint: enumerate
            query:
              criteria: volume>200
      """
    When the following request is received:
      """
      GET /pots/big/ HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Updating method mapping
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /big:
          GET:
            endpoint: enumerate
            query:
              criteria: volume>200 # closed
      """
    Then the `pots` is stopped
    Then the `pots` is running with the following manifest:
      """yaml
      exposition:
        /big:
          GET:
            endpoint: enumerate
            query:
              criteria: volume>200; # open
      """
    When the following request is received:
      """
      GET /pots/big/?criteria=temperature>50 HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      """
