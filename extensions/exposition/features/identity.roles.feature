@security
Feature: Roles management

  Scenario: Granting a role to an Identity
    # root:secret
    # user:pass
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | root     | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | user     | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                  |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles |
    And the annotation:
      """yaml
      /:
        io:output: true
        auth:role: foo:bar
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      # user doesn't have the required role
      """
      GET / HTTP/1.1
      host: nex.toa.io
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
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      accept: application/yaml
      content-type: application/yaml

      role: foo:bar
      """
    Then the following reply is sent:
      """
      201 Created

      grantor: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    When the following request is received:
      # root adds a role to a user
      """
      POST /identity/roles/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      accept: application/yaml
      content-type: application/yaml

      role: foo:baz
      """
    Then the following reply is sent:
      """
      201 Created
      """

    # user now have the role
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNz
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      """
    # repeat with token
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario Outline: Delegating roles
    # moderator:secret
    # assistant:pass
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | moderator | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | assistant | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                             |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles:delegation |
      | 30c969e05ff6437097ed5f07fc52358e | 72cf9b0ab0ac4ab2b8036e4e940ddcae | app:moderation                   |
    And the annotation:
      """yaml
      /:
        io:output: true
        auth:role: app:moderation:photos
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      # assistant doesn't have the required role
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Basic YXNzaXN0YW50OnBhc3M=
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      # moderator delegates a role to an assistant
      """
      POST /identity/roles/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic bW9kZXJhdG9yOnNlY3JldA==
      content-type: application/yaml

      role: <role>
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      # assistant has access
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Basic YXNzaXN0YW50OnBhc3M=
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Examples:
      | role                  |
      | app:moderation        |
      | app:moderation:photos |

  Scenario: Delegating role out of own scope
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | moderator | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | assistant | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                             |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles:delegation |
      | 30c969e05ff6437097ed5f07fc52358e | 72cf9b0ab0ac4ab2b8036e4e940ddcae | app:moderation                   |
    And the annotation:
      """yaml
      /:
        io:output: true
        auth:role: app:moderation:photos
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      POST /identity/roles/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml
      authorization: Basic bW9kZXJhdG9yOnNlY3JldA==

      role: app:finance
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity

      code: OUT_OF_SCOPE
      """

  Scenario: Delegating role without `system:identity:roles:delegation` role
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | moderator | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | assistant | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role           |
      | 30c969e05ff6437097ed5f07fc52358e | 72cf9b0ab0ac4ab2b8036e4e940ddcae | app:moderation |
    And the annotation:
      """yaml
      /:
        io:output: true
        auth:role: app:moderation:photos
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      POST /identity/roles/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      authorization: Basic bW9kZXJhdG9yOnNlY3JldA==

      role: app:moderation
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario Outline: Invalid role name
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | root     | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                  |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles |
    When the following request is received:
      # root adds a role to a user
      """
      POST /identity/roles/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      content-type: application/yaml

      role: <role>
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """
    Examples:
      | role          |
      | app!          |
      | app:          |
      | app:no spaces |

  Scenario: Dynamic roles
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | moderator | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                    |
      | 30c969e05ff6437097ed5f07fc52358e | 72cf9b0ab0ac4ab2b8036e4e940ddcae | app:29e54ae1:moderation |
    And the annotation:
      """yaml
      /:
        /broken:
          auth:role: app:{org}:moderation
          GET:
            dev:stub: never
        /:org:
          io:output: true
          auth:role: app:{org}:moderation
          GET:
            dev:stub:
              access: granted!
      """
    When the following request is received:
      """
      GET /29e54ae1/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic bW9kZXJhdG9yOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /88584c9b/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic bW9kZXJhdG9yOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    When the following request is received:
      """
      GET /broken/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic bW9kZXJhdG9yOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      500 Internal Server Error
      """
