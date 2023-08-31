Feature: Access authorization

  Background:
    Given the `identity.basic` database contains:
      # developer:secret
      # user:12345
      | _id                              | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
      | e8e4f9c2a68d419b861403d71fabc915 | user      | $2b$10$Frszmrmsz9iwSXzBbRRMKeDVKsNxozkrLNSsN.SnVC.KPxLtQr/bK |

  Scenario: Deny by default
    Given the annotation:
      """yaml
      /:
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Allow anonymous access
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      access: granted!
      """

  Scenario: Deny access with credentials to a resource with anonymous access
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Using `auth:id` directive
    Given the annotation:
      """yaml
      /:id:
        auth:id: id
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      access: granted!
      """
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic dXNlcjoxMjM0NQ==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Using `auth:role` directive
    Given the `identity.roles` database contains:
      | _id                              | identity                         | role      |
      | 775a648d054e4ce1a65f8f17e5b51803 | efe3a65ebbee47ed95a73edd911ea328 | developer |
      | 1d95bd2c764142818f6ece5e084015b5 | efe3a65ebbee47ed95a73edd911ea328 | user      |
    And the annotation:
      """yaml
      /:
        auth:role: developer
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      # identity with `developer` and `user` roles
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      access: granted!
      """
    When the following request is received:
      # identity with no roles
      """
      GET / HTTP/1.1
      authorization: Basic dXNlcjoxMjM0NQ==
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Using `auth:role` directive with scope matching
    Given the `identity.roles` database contains:
      | _id                              | identity                         | role           |
      | 775a648d054e4ce1a65f8f17e5b51803 | efe3a65ebbee47ed95a73edd911ea328 | developer:rust |
    And the annotation:
      """yaml
      /:
        auth:role: developer:rust:junior  # role scope matches
        /nested:
          GET:
            dev:stub: good!
      /javascript:
        auth:role: developer:javascript   # role scope does not match
        GET:
          dev:stub: no good!
      """
    When the following request is received:
      """
      GET /nested/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain

      good!
      """
    When the following request is received:
      """
      GET /javascript/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Allow by `auth:role` matching one of the roles
    Given the `identity.roles` database contains:
      | _id                              | identity                         | role      |
      | 775a648d054e4ce1a65f8f17e5b51803 | efe3a65ebbee47ed95a73edd911ea328 | developer |
    And the annotation:
      """yaml
      /:
        role:
          - developer
          - admin
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      # identity with `developer` and `user` roles
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      access: granted!
      """

  Scenario: Using `auth:rule` directive
    Given the `identity.roles` database contains:
      | _id                              | identity                         | role           |
      | 775a648d054e4ce1a65f8f17e5b51803 | efe3a65ebbee47ed95a73edd911ea328 | developer:rust |
    And the annotation:
      """yaml
      /rust/:id:
        auth:rule:
          id: id
          role: developer:rust
        GET:
          dev:stub:
            access: granted!
      /javascript/:id:
        rule:
          id: id
          role: developer:javascript
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET /rust/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      access: granted!
      """
    When the following request is received:
      """
      GET /javascript/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Token authentication scheme
    Given the annotation:
      """yaml
      /:id:
        auth:id: id
        GET:
          dev:stub:
            access: granted!
      """
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Token v3.local.Ks6rVDVU5uuSBQI4-Yp_vV4N_I_u0KpGYGn5jlM0QLDsCGKFEvekI1W88NSGKyiXJDl2KHb0FSrCDXHhzeZaFHKNOOYSRhZAi546kvKqGSYLeuY0g_-2hSPaOTxeTtsE7VdLyCa5xdkXq1PB8_UQWnYVMW3i8I1mITYyax2yu9G_E0Qf4XH-8eYXlQnfnqofwLUih6mAjOMpaAP9uzJgkWs-6oJ1JOmttwZfEQ
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      access: granted!
      """
    And the reply does not contain:
      """
      authorization: Token
      """
    When the following request is received:
      """
      GET /efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Token v3.local.o6HcCI-YPaoI-wm7POxmgIjStJLPyasqrhoz4DXqFgqatBdJh-OV8-HpyWI7UWwiVyy_tZiOtjuSs8JZMW9deLbeorwdFQS1xiJh9VRTa5ntUMTBsQJ2tBftJkAm0frmd_DP_veTqJqvIbjPW0cqsU0s_f3qT-b5C3cqmmcxVk5-L6JYUmD7VhDFKynTk0Z9bgI_r0wYMiCuotYEGNfl7h0_WNrxfO57BQJhkQ
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Switching to Token authentication scheme
    Given the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          auth:id: id
          GET: greet
      """
    When the following request is received:
      """
      GET /greeter/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      authorization: Token

      output: Hello
      """

  Scenario: Refreshing stale token
    Given the `identity.tokens` configuration:
      """yaml
      stale: 0.0000003858024690358 # this will result in less than 1 second freshness
      """
    And the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          auth:id: id
          GET: greet
      """
    When the following request is received:
      """
      GET /greeter/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      authorization: Token ${{ token }}

      output: Hello
      """
    Then after 1 second
    When the following request is received:
      """
      GET /greeter/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      authorization: Token

      output: Hello
      """

  Scenario: Using token with roles
    Given the annotation:
      """yaml
      /:
        auth:role: developer
        GET:
          dev:stub:
            access: granted!
      """
    And the `identity.roles` database contains:
      | _id                              | identity                         | role      |
      | 775a648d054e4ce1a65f8f17e5b51803 | efe3a65ebbee47ed95a73edd911ea328 | developer |
    When the following request is received:
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      authorization: Token ${{ token }}

      access: granted!
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      access: granted!
      """
