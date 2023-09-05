Feature: Roles management

  Scenario: Adding a role to an Identity
    Given the `identity.basic` database contains:
      | _id                              | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | root     | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | user     | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                  |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles |
    And the annotation:
      """yaml
      /:
        auth:role: test
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      # user doesn't have the required role
      """
      GET / HTTP/1.1
      authorization: Basic dXNlcjpwYXNz
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      # root adds a role to a user
      """
      POST /identity/roles/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      authorization: Basic cm9vdDpzZWNyZXQ=
      content-type: application/yaml

      role: test
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      # user now have the role
      """
      GET / HTTP/1.1
      authorization: Basic dXNlcjpwYXNz
      """
    Then the following reply is sent:
      """
      200 OK
      """
