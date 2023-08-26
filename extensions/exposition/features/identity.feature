Feature: Idenity

  Background:
    Given the `identity.basic` database is empty

  Scenario: Creating new Identity with basic credentials
    When the following request is received:
      """
      POST /identity/basic/ HTTP/1.1
      accept: application/yaml
      content-type: application/yaml
      content-length: 37

      username: developer
      password: secret
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      output:
        id:
      """
