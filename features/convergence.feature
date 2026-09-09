Feature: Convergence

  A record committed here reaches the other regions, and what they write reaches this one — as
  it stands, and only where it supersedes what is stored.

  The suite is the region `us`, and it publishes to that region's own broker: what the
  composition sends arrives there by federation, and what it sends from there arrives at the
  composition the same way. Two compositions could not do it, because which region a deployment
  is comes from the environment, and one process has one of those.

  Background:
    Given an environment variable `TOA_REGION` is set to "0"
    And an environment variable `TOA_CONVERGENCE_BINDING` is set to "@toa.io/bindings.amqp"
    And an environment variable `TOA_CONVERGENCE_BROKERS` is set to "amqp://localhost:31013"
    And an environment variable `TOA_CONVERGENCE_BROKERS_USERNAME` is set to "developer"
    And an environment variable `TOA_CONVERGENCE_BROKERS_PASSWORD` is set to "secret"
    And the `mongo.converging` convergence queue is empty
    And the `mongo.converging` database contains:
      | _id                              | foo | VERSION | REGION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | 3       | 0      |

  Scenario: A committed record reaches the other region
    Given the region "us" is consuming `mongo.converging`
    And I compose converging components:
      | mongo.converging |
    When I call `mongo.converging.transit` with:
      """yaml
      input:
        foo: 1
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the region "us" is sent `mongo.converging`:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      VERSION: 4
      REGION: 0
      """

  Scenario: A record from another region is written as it stands
    Given I compose converging components:
      | mongo.converging |
    And the region "us" writes to `mongo.converging`:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 7
      VERSION: 9
      CREATED: 1757320000000
      UPDATED: 1757337600000
      DELETED: null
      REGION: 1
      """
    When convergence has settled
    Then the `mongo.converging` database contains:
      | _id                              | foo | VERSION | REGION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 7   | 9       | 1      |

  Scenario: A stale record changes nothing
    Given I compose converging components:
      | mongo.converging |
    And the region "us" writes to `mongo.converging`:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 7
      VERSION: 2
      CREATED: 1757320000000
      UPDATED: 1757337600000
      DELETED: null
      REGION: 1
      """
    When convergence has settled
    Then the `mongo.converging` database contains:
      | _id                              | foo | VERSION | REGION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | 3       | 0      |

  Scenario: A record of one version written by an outranked region is dropped
    Given I compose converging components:
      | mongo.converging |
    And the region "us" writes to `mongo.converging`:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 7
      VERSION: 3
      CREATED: 1757320000000
      UPDATED: 1757337600000
      DELETED: null
      REGION: 1
      """
    When convergence has settled
    Then the `mongo.converging` database contains:
      | _id                              | foo | VERSION | REGION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | 3       | 0      |
