@security
Feature: Bans

  Background:
    Given the `identity.basic` database contains:
    # developer:secret
    # user:12345
      | _id                              | username  | password                                                     | _deleted |
      | efe3a65ebbee47ed95a73edd911ea328 | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O | null     |
      | e8e4f9c2a68d419b861403d71fabc915 | user      | $2b$10$Frszmrmsz9iwSXzBbRRMKeDVKsNxozkrLNSsN.SnVC.KPxLtQr/bK | null     |
    And the `identity.bans` database is empty

  Scenario: Banning an Identity
    Given the `identity.roles` database contains:
      | _id                              | identity                         | role                 |
      | 775a648d054e4ce1a65f8f17e5b51803 | efe3a65ebbee47ed95a73edd911ea328 | system:identity:bans |
    And the annotation:
      """yaml
      /:
        /:id:
          io:output: true
          auth:id: id
          GET:
            dev:stub:
              access: granted!
      """
    And the `identity.tokens` configuration:
      """yaml
      refresh: 1
      """
    When the following request is received:
      """
      GET /e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Basic dXNlcjoxMjM0NQ==
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      """
    When the following request is received:
      """
      PUT /identity/bans/e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      banned: true
      comment: Bye bye
      """
    Then the following reply is sent:
      """
      200 OK
      """
    # accessing a resource with a banned Identity
    When the following request is received:
      """
      GET /e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Basic dXNlcjoxMjM0NQ==
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    Then after 1 second
    When the following request is received:
      """
      GET /e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      PUT /identity/bans/e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      banned: false
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Basic dXNlcjoxMjM0NQ==
      """
    Then the following reply is sent:
      """
      200 OK

      authorization: Token ${{ new_token }}
      """
    # re-ban
    When the following request is received:
      """
      PUT /identity/bans/e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      content-type: application/yaml

      banned: true
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Basic dXNlcjoxMjM0NQ==
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    Then after 1 second
    When the following request is received:
      """
      GET /e8e4f9c2a68d419b861403d71fabc915/ HTTP/1.1
      authorization: Token ${{ new_token }}
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
