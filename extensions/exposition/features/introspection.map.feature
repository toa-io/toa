@security
Feature: Reading the introspection map

  The map declares how it is exposed in its own manifests, and those manifests are what
  this mounts — not a copy of them. A route the gateway cannot answer, or an answer it
  drops for want of a directive, is caught here rather than in a running application.

  Background:
    # developer:secret, user:12345
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
      | e8e4f9c2a68d419b861403d71fabc915 | nex       | user      | $2b$10$Frszmrmsz9iwSXzBbRRMKeDVKsNxozkrLNSsN.SnVC.KPxLtQr/bK |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role                 |
      | 3e2b0c8a1f7d4e9ab0c6d5e4f3a2b1c0 | efe3a65ebbee47ed95a73edd911ea328 | system:introspection |
    And the `identity.bans` database is empty
    And the annotation of the introspection map
    And the introspection components are running

  Scenario: Reading the nodes
    Given the `introspection.nodes` database contains:
      | _id                              | namespace | component | version  | _version | _deleted |
      | 70e1a6551346c6932657cdb2526df0fa | pots      | tea       | 7bb04bba | 1        | null     |
    When the following request is received:
      """
      GET /introspection/nodes/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      - id: 70e1a6551346c6932657cdb2526df0fa
        namespace: pots
        component: tea
        version: 7bb04bba
      """

  Scenario: Reading one node
    Given the `introspection.nodes` database contains:
      | _id                              | namespace | component | version  | _version | _deleted |
      | 70e1a6551346c6932657cdb2526df0fa | pots      | tea       | 7bb04bba | 1        | null     |
    When the following request is received:
      """
      GET /introspection/nodes/70e1a6551346c6932657cdb2526df0fa/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      namespace: pots
      component: tea
      """

  Scenario: Reading the edges
    An empty map is still a body — the directive that would drop it is the point.

    Given the `introspection.edges` database is empty
    When the following request is received:
      """
      GET /introspection/edges/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      []
      """

  Scenario: The map is not readable without the role
    When the following request is received:
      """
      GET /introspection/nodes/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjoxMjM0NQ==
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
