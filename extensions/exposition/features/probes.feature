Feature: Probes

  Scenario: Startup probe
    Given the Gateway is running
    And after 1 second
    When the following request is received:
      """
      GET /.ready HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
