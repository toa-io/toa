Feature: AMQP deployment

  Scenario: Deploy sources Pointer
    Given I have a component `external.consumer`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://localhost
        sources:
          external: amqp://external.example.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      variables:
        external-consumer:
          - name: TOA_AMQP_SOURCES_EXTERNAL
            value: amqp://external.example.com
      """
