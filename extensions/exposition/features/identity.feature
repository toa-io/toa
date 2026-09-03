Feature: Identity resource

  Scenario: Requesting own Identity
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role            |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | efe3a65ebbee47ed95a73edd911ea328 | developer       |
      | 88ec8e348a5c48aaa2d25faa904cd9ff | efe3a65ebbee47ed95a73edd911ea328 | system:identity |
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ User.token }}

      id: efe3a65ebbee47ed95a73edd911ea328
      roles:
        - developer
        - system:identity
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ User.token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ User.id }}
      roles:
        - developer
        - system:identity
      """
    # checking that it returns the same id for given token
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ User.token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ User.id }}
      roles:
        - developer
        - system:identity
      """

  Scenario: Getting transient Identity
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      id: ${{ id }}
      roles: []
      """

  Scenario: Requesting Identity with non-existent credentials
    Given the `identity.basic` database is empty
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Authenticating with a scheme named after an object property
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Constructor abc
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: __proto__ abc
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """

  Scenario: Failing authentication repeatedly
    Given the annotation:
      """yaml
      ip: x-real-ip
      bouncer:
        attempts: 2
        interval: 60
      """
    # developer:wrong, from the connection: the proxy header is not sent
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    # the address has spent its attempts, and earns one back in interval / attempts seconds
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      """
    Then the following reply is sent:
      """
      429 Too Many Requests
      retry-after: 30
      """
    # a request without credentials is not metered
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      201 Created
      """

  Scenario: Failing authentication behind a trusted proxy
    Given the annotation:
      """yaml
      ip: x-real-ip
      bouncer:
        attempts: 1
        interval: 60
      """
    # developer:wrong
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      x-real-ip: 203.0.113.1
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      x-real-ip: 203.0.113.1
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      """
    Then the following reply is sent:
      """
      429 Too Many Requests
      """
    # another address, as the proxy reports it
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      x-real-ip: 203.0.113.2
      authorization: Basic ZGV2ZWxvcGVyOndyb25n
      """
    Then the following reply is sent:
      """
      401 Unauthorized
      """
