Feature: Transactional outbox

  A state change and the intent to publish its events commit together, so a process that dies
  between them cannot lose the event. In a healthy system the row is published at once and
  marked published on the next cycle, so the collection stays empty of unpublished rows.

  Background:
    Given the `mongo.sink` event queues are empty
    And the `mongo.outbox` database contains:
      | _id                              | foo | bar   | _version |
      | 6b93e57cc0e14fce95c4496c21086781 | 0   | hello | 1        |
    And the `mongo.sink` database contains:
      | _id                              | count | _version |
      | 6b93e57cc0e14fce95c4496c21086781 | 0     | 1        |

  Scenario: A committed transition is published and settled
    Given I compose components:
      | mongo.outbox |
      | mongo.sink   |
    When I call `mongo.outbox.transit` with:
      """yaml
      input:
        foo: 1
        bar: world
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received
    And I wait 0.3 second
    And I call `mongo.sink.observe` with:
      """yaml
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      count: 1
      """
    And the `mongo.outbox` outbox holds 1 published row

  Scenario: An assignment carries its pre-image
    Given I compose `mongo.outbox` component
    When I call `mongo.outbox.assign` with:
      """yaml
      input:
        foo: 2
        bar: baz
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received
    And the `mongo.outbox` outbox row carries an origin

  Scenario: The post-image an assignment replies with is the stored one
    Given I compose `mongo.outbox` component
    When I call `mongo.outbox.assign` with:
      """yaml
      input:
        foo: 7
        bar: computed
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received
    And the `mongo.outbox` record matches the last reply

  Scenario: A row left behind by a crash is recovered by the sweep
    # seeding a row *is* the post-crash state: the entity was written, the event was not sent,
    # and nothing but the sweep is left to send it
    Given the `mongo.outbox` outbox contains:
      | _id                              | lane | pending | event                                                                                                       |
      | aa11e57cc0e14fce95c4496c21086781 | 0    | 0       | {"trailers":{"inc":9},"state":{"id":"6b93e57cc0e14fce95c4496c21086781","foo":9,"bar":"recovered","_version":2,"_deleted":null}} |
    And I compose components:
      | mongo.outbox |
      | mongo.sink   |
    And I wait 1.5 second
    When I call `mongo.sink.observe` with:
      """yaml
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      count: 1
      """
    And the `mongo.outbox` outbox holds 1 published row

  Scenario: With immediate publication deferred, the sweep alone delivers
    Given an environment variable `TOA_OUTBOX_DEFER` is set to "1"
    And I compose components:
      | mongo.outbox |
      | mongo.sink   |
    When I call `mongo.outbox.transit` with:
      """yaml
      input:
        foo: 4
        bar: deferred
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received
    And I wait 1.5 second
    And I call `mongo.sink.observe` with:
      """yaml
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      count: 1
      """
    And the `mongo.outbox` outbox holds 1 published row

  Scenario: Trailers survive the row
    # `_trailers` is non-enumerable on the state object, but `Entity.event` copies it onto the
    # event as an ordinary field — which is the assumption the whole design rests on, and this
    # is the only scenario that puts it through the database
    Given an environment variable `TOA_OUTBOX_DEFER` is set to "1"
    And I compose components:
      | mongo.outbox |
      | mongo.sink   |
    When I call `mongo.outbox.bump` with:
      """yaml
      input:
        inc: 5
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received
    And I wait 1.5 second
    And I call `mongo.sink.observe` with:
      """yaml
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      inc: 5
      """

  Scenario: A component with nothing to publish takes no transaction and writes no row
    # `prototype: null` is the only shape in which a component with an entity declares no
    # events at all, so it is the only way to reach the branch that skips the outbox entirely
    Given the `proto.plain` database contains:
      | _id                              | foo | _version |
      | 3c41e57cc0e14fce95c4496c21086781 | 0   | 1        |
    And I compose `proto.plain` component
    When I call `proto.plain.write` with:
      """yaml
      input:
        foo: 8
      query:
        id: 3c41e57cc0e14fce95c4496c21086781
      """
    Then the reply is received
    And the `proto.plain` outbox is empty

  Scenario: The broker is down at commit, and the event goes out when it returns
    # the failure the outbox exists for: the state change must not be lost with the publish
    Given an environment variable `TOA_AMQP_CONTEXT` is set to "eyIuIjpbImFtcXA6Ly9sb2NhbGhvc3Q6NTY3MyJdfQ=="
    And an environment variable `TOA_AMQP_CONTEXT__USERNAME` is set to "developer"
    And an environment variable `TOA_AMQP_CONTEXT__PASSWORD` is set to "secret"
    And an environment variable `TOA_DEV` is set to "0"
    And an environment variable `TOA_CONTEXT` is set to "toa-dev"
    And an environment variable `TOA_MONGODB_MONGO_OUTBOX` is set to "mongodb://localhost:27017"
    And an environment variable `TOA_MONGODB_MONGO_OUTBOX_USERNAME` is set to "developer"
    And an environment variable `TOA_MONGODB_MONGO_OUTBOX_PASSWORD` is set to "secret"
    When I start docker container `rabbitmq`
    And I compose `mongo.outbox` component
    And I stop docker container `rabbitmq`
    And I call `mongo.outbox.transit` with:
      """yaml
      input:
        foo: 6
        bar: offline
      query:
        id: 6b93e57cc0e14fce95c4496c21086781
      """
    Then the reply is received
    And the `mongo.outbox` outbox holds 1 unpublished row

  Scenario: A storage that cannot commit a row publishes inline instead
    # a standalone mongod runs no transactions, and an outbox without atomicity would be worse
    # than none — so the storage does not offer one and the runtime emits as it always did
    Given an environment variable `TOA_DEV` is set to "0"
    And an environment variable `TOA_ENV` is set to "local"
    And an environment variable `TOA_CONTEXT` is set to "toa-dev"
    And an environment variable `TOA_MONGODB_MONGO_OUTBOX` is set to "mongodb://localhost:27018"
    And an environment variable `TOA_MONGODB_MONGO_OUTBOX_USERNAME` is set to "testcontainersuser"
    And an environment variable `TOA_MONGODB_MONGO_OUTBOX_PASSWORD` is set to "secret"
    And an environment variable `TOA_AMQP_CONTEXT` is set to "eyIuIjpbImFtcXA6Ly9sb2NhbGhvc3QiXX0="
    And an environment variable `TOA_AMQP_CONTEXT__USERNAME` is set to "developer"
    And an environment variable `TOA_AMQP_CONTEXT__PASSWORD` is set to "secret"
    When I start docker container `mongodb`
    And I compose `mongo.outbox` component
    And I call `mongo.outbox.transit` with:
      """yaml
      input:
        foo: 2
        bar: standalone
      """
    Then the reply is received
