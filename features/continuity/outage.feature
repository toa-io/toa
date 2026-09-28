Feature: Continuity through an outage of what keeps the runs

  @containers
  Scenario: A run waits for the journal's database, and picks up once it is back
    Given environment variables:
      """
      TOA_DEV=0
      TOA_MONGODB_CONTINUITY_JOURNAL=mongodb://localhost:31021
      TOA_MONGODB_CONTINUITY_JOURNAL_USERNAME=testcontainersuser
      TOA_MONGODB_CONTINUITY_JOURNAL_PASSWORD=secret
      TOA_MONGODB_CONTINUED_TALLY=mongodb://localhost:31020
      TOA_MONGODB_CONTINUED_TALLY_USERNAME=developer
      TOA_MONGODB_CONTINUED_TALLY_PASSWORD=secret
      TOA_ENV=local
      TOA_CONTEXT=toa-dev
      TOA_AMQP_CONTEXT={".":["amqp://localhost:31010"]}
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    And the `continued.tally` database is empty
    When I start docker container `mongodb`
    And the `continuity` service is staged
    And I compose components:
      | continued.tally |
      | continued.flow  |
    And I stop docker container `mongodb`
    And I call `continued.flow.run` with:
      """yaml
      input:
        a: 0a000000000000000000000000000021
        b: 0b000000000000000000000000000021
        fail: 1
      task: true
      """
    And I wait 3 seconds
    And I start docker container `mongodb`
    And I wait 5 seconds
    Then the `continued.tally` database holds:
      | _id                              | n |
      | 0a000000000000000000000000000021 | 1 |
      | 0b000000000000000000000000000021 | 1 |
    And I disconnect
