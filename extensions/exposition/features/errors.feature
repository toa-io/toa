Feature: Errors

  Scenario Outline: Missing routes
    Given the `greeter` is running with the following manifest:
      """yaml
      namespace: basic
      """
    When the following request is received:
      """http
      GET <route> HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      404 Not Found
      """
    Examples:
      | route                                |
      | /basic/greeter/non-existent-segment/ |
      | /basic/non-existent-component/       |
      | /non-existent-namespace              |

  Scenario: Missing method
    Given the `greeter` is running
    When the following request is received:
      """http
      PATCH /greeter HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      405 Method Not Allowed
      """

  Scenario: Unsupported Method
    When the following request is received:
      """http
      COPY /basic/greeter HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      501 Not Implemented
      """
