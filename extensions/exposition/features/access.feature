Feature: Access authorization

  Background:
    Given the `identity.basic` database contains:
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

  Scenario: Allow by `auth:id` directive
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
