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
          dev:stub: good!
      /javascript:
        auth:role: developer:javascript   # role scope does not match
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
        dev:stub:
          access: granted!
      /javascript/:id:
        rule:
          id: id
          role: developer:javascript
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
