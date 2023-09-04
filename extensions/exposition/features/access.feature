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
      authorization: Token v3.local.9oEtVJkfRw4cOJ8M4DxuVuAN29dGT26XMYyPAoXtwrkdkiJVSVj46sMNAOdlxwKGszJZV_ReOL26dxDVlsQ7QAIuRhRPlvsHYNOhcD-LApoAXV0S3IK16EMoEv7tE9z70FCLC3WoIW9RIQ8PR3uZhAdhSgBilsVOpWrk4XtnfCIlVwhYMKu79a66oZZhV2Q7Kl3nfYsf84-6rAL_1H0MsqCDUHVXuIg
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
      authorization: Token v3.local.cjlxn4IJ9hI92KuksguzDx7_kYxgDFFGFnfNchf0cWnmos34dqX2XpTAUBd-LqgqfuH-lVGfNvjBUkw5JtHRBiIAVaPHF3Ncc0eafwgH2DPme9pndZL92fWryGnJ-sMHA28Q6UcXsIfhgd2JZ0n-585SBhwlosC3gKTcVHK7XNljeaTen4jZPw8uY-pdbsm6dDq3aKMzl8K78_BTTfiNPG2cI_aNuHw
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden
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

  Scenario: Using `auth:scheme` directive
    Given the annotation:
      """yaml
      /:id:
        auth:scheme: basic
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
      authorization: Token v3.local.9oEtVJkfRw4cOJ8M4DxuVuAN29dGT26XMYyPAoXtwrkdkiJVSVj46sMNAOdlxwKGszJZV_ReOL26dxDVlsQ7QAIuRhRPlvsHYNOhcD-LApoAXV0S3IK16EMoEv7tE9z70FCLC3WoIW9RIQ8PR3uZhAdhSgBilsVOpWrk4XtnfCIlVwhYMKu79a66oZZhV2Q7Kl3nfYsf84-6rAL_1H0MsqCDUHVXuIg
      accept: text/plain
      """
    Then the following reply is sent:
      """
      403 Forbidden

      Basic authentication scheme is required to access this resource.
      """
