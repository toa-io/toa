@security
Feature: Configuration values

  The values component declares how it is exposed in its own manifest, and that manifest
  is what this mounts. Reading takes `system:configuration:get`, creating takes
  `system:configuration:create`, and the one who creates is recorded as the originator.

  Background:
    # developer:secret, user:12345
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
      | e8e4f9c2a68d419b861403d71fabc915 | nex       | user      | $2b$10$Frszmrmsz9iwSXzBbRRMKeDVKsNxozkrLNSsN.SnVC.KPxLtQr/bK |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                     |
      | 1c0b2a3d4e5f4a6b8c7d9e0f1a2b3c4d | efe3a65ebbee47ed95a73edd911ea328 | system:configuration     |
      | 2c0b2a3d4e5f4a6b8c7d9e0f1a2b3c4d | e8e4f9c2a68d419b861403d71fabc915 | system:configuration:get |
    And the `identity.bans` database is empty
    And the `configuration.values` database is empty
    And the configuration values are deployed:
      """yaml
      dummies.dummy:
        epoch: e1
        schema:
          type: object
          properties:
            foo:
              type: string
            bar:
              type: string
              default: world
        defaults:
          foo: deployed
      """
    And the configuration values are running

  Scenario: Reading the deployed configuration
    When the following request is received:
      """
      GET /configuration/values/dummies.dummy/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjoxMjM0NQ==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      foo: deployed
      """

  Scenario: Reading without the role
    When the following request is received:
      """
      GET /configuration/values/dummies.dummy/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Reading the configuration of an unknown component
    When the following request is received:
      """
      GET /configuration/values/dummies.unknown/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Creating configuration
    When the following request is received:
      """
      POST /configuration/values/dummies.dummy/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      content-type: application/yaml

      configuration:
        foo: created
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      epoch: e1
      """
    When the following request is received:
      """
      GET /configuration/values/dummies.dummy/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjoxMjM0NQ==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      foo: created
      bar: world
      """

  Scenario: Creating configuration without the role
    When the following request is received:
      """
      POST /configuration/values/dummies.dummy/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjoxMjM0NQ==
      content-type: application/yaml

      configuration:
        foo: created
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Creating configuration not fitting the schema
    When the following request is received:
      """
      POST /configuration/values/dummies.dummy/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      configuration:
        foo:
          nested: true
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity
      """

  Scenario: Creating configuration for an unknown component
    When the following request is received:
      """
      POST /configuration/values/dummies.unknown/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      configuration: {}
      """
    Then the following reply is sent:
      """
      422 Unprocessable Entity
      """
