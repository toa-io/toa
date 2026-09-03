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

      code: INACCESSIBLE_SCOPE
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

  Scenario: Invalid identity id
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | root     | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                  |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles |
    When the following request is received:
      """
      POST /identity/roles/invalid/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      content-type: application/yaml

      role: app:test
      """
    Then the following reply is sent:
      """
      400 Bad Request
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

  Scenario: Role changes reach a Token holder at refresh
    # root:secret
    # user:pass
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | root     | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | user     | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                  |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles |
    And the `identity.tokens` configuration:
      """yaml
      refresh: 1
      """
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
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNz
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      """
    When the following request is received:
      # root grants a role to the user
      """
      POST /identity/roles/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      content-type: application/yaml

      role: foo:bar
      """
    Then the following reply is sent:
      """
      201 Created
      """
    # the token was issued before the grant
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    Then after 1 second
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ granted }}
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ granted }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      access: granted!
      """
    When the following request is received:
      # root revokes the role
      """
      DELETE /identity/roles/4344518184ad44228baffce7a44fd0b1/foo:bar/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Then after 1 second
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ granted }}
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ revoked }}
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ revoked }}
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Revoking a role without `system:identity:roles`
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | user     | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role    |
      | 30c969e05ff6437097ed5f07fc52358e | 4344518184ad44228baffce7a44fd0b1 | foo:bar |
    When the following request is received:
      """
      DELETE /identity/roles/4344518184ad44228baffce7a44fd0b1/foo:bar/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNz
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Revoking a role revokes custom tokens
    # root:secret
    # user:pass
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | root     | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | user     | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                  |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | system:identity:roles |
      | 30c969e05ff6437097ed5f07fc52358e | 4344518184ad44228baffce7a44fd0b1 | foo:bar               |
    And the `identity.keys` database is empty
    And the `identity.tokens` configuration:
      """yaml
      cache:
        ttl: 1
      """
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
      """
      POST /identity/tokens/4344518184ad44228baffce7a44fd0b1/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNz
      accept: application/yaml
      content-type: application/yaml

      label: Forever token
      lifetime: 0
      """
    Then the following reply is sent:
      """
      201 Created

      token: ${{ token }}
      """
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
    When the following request is received:
      # root revokes the role
      """
      DELETE /identity/roles/4344518184ad44228baffce7a44fd0b1/foo:bar/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      """
    Then the following reply is sent:
      """
      200 OK
      """
    # the key is revoked eventually, and the runtime forgets it after `cache.ttl`
    Then after 2 seconds
    When the following request is received:
      """
      GET / HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
