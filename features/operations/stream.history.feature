Feature: A token lasts as long as the history the storage keeps

  Background:
    Given an environment variable `TOA_DEV` is set to "0"
    And an environment variable `TOA_ENV` is set to "local"
    And an environment variable `TOA_CONTEXT` is set to "toa-dev"
    And an environment variable `TOA_AMQP_CONTEXT` is set to "{\".\":[\"amqp://localhost:31010\"]}"
    And an environment variable `TOA_AMQP_CONTEXT__USERNAME` is set to "developer"
    And an environment variable `TOA_AMQP_CONTEXT__PASSWORD` is set to "secret"

  @containers
  Scenario: A token older than the history the storage keeps
    Given an environment variable `TOA_MONGODB_STREAMS_TOKENS` is set to "mongodb://localhost:31022"
    When I start docker container `mongodb-rs`
    And I compose `streams.tokens` component
    And I call `streams.tokens.transit` with:
      """yaml
      input:
        owner: alice
        title: milk
      """
    And I read `streams.tokens.stream` with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the stream ended with a token
    When the history of the MongoDB at 31022 rolls over
    And I read `streams.tokens.stream` from the token with:
      """yaml
      query:
        criteria: owner==alice
      """
    Then the following exception is thrown:
      """yaml
      code: 308
      """

  @containers
  Scenario: A storage that keeps no history
    Given an environment variable `TOA_MONGODB_OPERATIONS_STREAMS` is set to "mongodb://localhost:31021"
    And an environment variable `TOA_MONGODB_OPERATIONS_STREAMS_USERNAME` is set to "testcontainersuser"
    And an environment variable `TOA_MONGODB_OPERATIONS_STREAMS_PASSWORD` is set to "secret"
    When I start docker container `mongodb`
    And I compose `operations.streams` component
    And I call `operations.streams.transit` with:
      """yaml
      input:
        foo: 1
        bar: hello
      """
    And I read `operations.streams.stream` with:
      """yaml
      query:
        limit: 1
      """
    Then the stream ended with a token
    When I read `operations.streams.stream` from the token with:
      """yaml
      query:
        limit: 1
      """
    Then the stream ended with no position to continue from
    And the copy holds 1 entries
