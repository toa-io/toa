Feature: AMQP deployment

  Background:
    Given I have a component `external.consumer`

  Scenario: Deploy a context
    Given I have a context with:
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
        global:
          - name: TOA_AMQP_CONTEXT
            value: eyIuIjpbImFtcXA6Ly9sb2NhbGhvc3QiXX0=
          - name: TOA_AMQP_CONTEXT__USERNAME
            secret:
              name: toa-amqp-context.default
              key: username
          - name: TOA_AMQP_CONTEXT__PASSWORD
            secret:
              name: toa-amqp-context.default
              key: password
      """

  Scenario: Deploy a context with namespace-specific cluster
    Given I have a context with:
      """yaml
      amqp:
        context:
          external: amqp://localhost
        sources:
          external: amqp://localhost
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      variables:
        global:
          - name: TOA_AMQP_CONTEXT_EXTERNAL_USERNAME
            secret:
              name: toa-amqp-context-external
              key: username
          - name: TOA_AMQP_CONTEXT_EXTERNAL_PASSWORD
            secret:
              name: toa-amqp-context-external
              key: password
      """

  Scenario: Deploy a context with component-specific cluster
    Given I have a context with:
      """yaml
      amqp:
        context:
          external.consumer: amqp://localhost
        sources:
          external: amqp://localhost
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      variables:
        global:
          - name: TOA_AMQP_CONTEXT_EXTERNAL_CONSUMER_USERNAME
            secret:
              name: toa-amqp-context-external-consumer
              key: username
          - name: TOA_AMQP_CONTEXT_EXTERNAL_CONSUMER_PASSWORD
            secret:
              name: toa-amqp-context-external-consumer
              key: password
      """

  Scenario: Deploy sources Pointer
    Given I have a context with:
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
          - name: TOA_AMQP_SOURCES_EXTERNAL_USERNAME
            secret:
              name: toa-amqp-sources-external
              key: username
          - name: TOA_AMQP_SOURCES_EXTERNAL_PASSWORD
            secret:
              name: toa-amqp-sources-external
              key: password
      """
