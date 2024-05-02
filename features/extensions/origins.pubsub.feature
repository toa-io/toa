Feature: Google Pub/Sub client

  @skip # test is not disconnecting
  Scenario: Publishing a message
    Given I boot `origins.pubsub` component
    And the PubSub subscriber `test` for topic `projects/toa-test/topics/test` is running
    When I invoke `publish` with:
      """yaml
      input:
        hello: world
      """
    Then the reply is received
    And the PubSub subscriber `test` has received a message:
      """yaml
      hello: world
      """
    Then I disconnect
