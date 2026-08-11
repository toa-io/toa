@security
Feature: Persistent credentials management

  Background:
    # developer:secret
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.federation` database contains:
      | _id                              | authority | identity                         | iss                         | sub    | _created |
      | fed3a65ebbee47ed95a73edd911ea328 | nex       | efe3a65ebbee47ed95a73edd911ea328 | https://accounts.google.com | google | 1000     |
      | fed3a65ebbee47ed95a73edd911ea329 | nex       | efe3a65ebbee47ed95a73edd911ea328 | https://appleid.apple.com   | apple  | 900      |
    And the `identity.passkeys` database contains:
      | _id                              | authority | identity                         | kid     | aid                                  | synced | key    | counter | label           | _created |
      | ace3a65ebbee47ed95a73edd911ea328 | nex       | efe3a65ebbee47ed95a73edd911ea328 | key-one | adce0002-35bc-c60a-648b-0b25f1f05503 | true   | cHVibGlj | 0       | Personal iPhone | 2000     |

  Scenario: Listing all persistent credentials
    When the following request is received:
      """
      GET /identity/credentials/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}

      basic:
        username: developer
      federation:
        - id: fed3a65ebbee47ed95a73edd911ea328
          iss: https://accounts.google.com
          _created: 1000
        - id: fed3a65ebbee47ed95a73edd911ea329
          iss: https://appleid.apple.com
          _created: 900
      passkeys:
        - id: ace3a65ebbee47ed95a73edd911ea328
          aid: adce0002-35bc-c60a-648b-0b25f1f05503
          synced: true
          label: Personal iPhone
          _created: 2000
      """

  Scenario: Deleting credentials through their components
    When the following request is received:
      """
      GET /identity/credentials/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ token }}
      """
    When the following request is received:
      """
      DELETE /identity/basic/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    When the following request is received:
      """
      DELETE /identity/federation/efe3a65ebbee47ed95a73edd911ea328/fed3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    When the following request is received:
      """
      DELETE /identity/passkeys/efe3a65ebbee47ed95a73edd911ea328/ace3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    When the following request is received:
      """
      GET /identity/credentials/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      basic: null
      federation:
        - id: fed3a65ebbee47ed95a73edd911ea329
          iss: https://appleid.apple.com
          _created: 900
      passkeys: []
      """
