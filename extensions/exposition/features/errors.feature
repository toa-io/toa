Feature: Errors

  Background:
    Given the Gateway is running

  Scenario Outline: Missing routes
    Given the `greeter` is running with the following manifest:
      """yaml
      namespace: basic
      """
    When the following request is received:
      """
      GET <route> HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """
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
      """
      PATCH /greeter HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      405 Method Not Allowed
      """

  Scenario: Unsupported method
    When the following request is received:
      """
      COPY /basic/greeter HTTP/1.1
      accept: application/yaml
      """
    Then the following reply is sent:
      """http
      501 Not Implemented
      """

  Scenario: Request body does not match input schema
    Given the `pots` is running
    When the following request is received:
      """
      POST /pots HTTP/1.1
      accept: application/yaml
      content-type: application/yaml
      content-length: 20

      foo: Hello
      bar: 1.5
      """
    Then the following reply is sent:
      """
      400 Bad Request
      content-type: text/plain

      must have required property 'title'
      """
