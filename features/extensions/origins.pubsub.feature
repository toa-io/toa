Feature: Google Pub/Sub client

  @skip # test is not disconnecting
  Scenario: Publishing a message to the PubSub
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

  Scenario: PubSub deployment annotations
    Given I have a component `origins.pubsub`
    And I have a context with:
      """yaml
      origins:
        origins.pubsub:
          test: pubsub:///projects/toa-test/topics/test
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: origins-pubsub
          variables:
            - name: TOA_ORIGINS_ORIGINS_PUBSUB_TEST
              value: pubsub:///projects/toa-test/topics/test
            - name: TOA_ORIGINS_PUBSUB__TOA_TEST
              secret:
                name: toa-origins-pubsub
                key: toa-test
                optional: true
      """
