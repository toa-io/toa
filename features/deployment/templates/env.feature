Feature: Environment variable TOA_ENV

  Scenario: TOA_ENV for compositions
    Given I have a component `dummies.one`
    And I have a context
    When I export deployment for production
    And I run `helm template deployment`
    Then program should exit
    And composition-dummies-one Deployment container spec should contain:
      """
      env:
        - name: TOA_ENV
          value: production
      """

  Scenario: TOA_ENV for services
    Given I have a component `exposed.one`
    And I have a context
    When I export deployment for production
    And I run `helm template deployment`
    Then program should exit
    And service-exposition-resources Deployment container spec should contain:
      """
      env:
        - name: TOA_ENV
          value: production
      """

  Scenario: Common environment variable
    Given I have components:
      | external.consumer  |
      | external.consumer2 |
    And I have a context with:
      """yaml
      compositions:
        - name: external
          components:
            - external.consumer
            - external.consumer2
      amqp:
        context: amqp://localhost
        sources:
          external: amqp://rmq.example.com
      """
    When I export deployment for production
    And I run `helm template deployment`
    Then program should exit
    And composition-external Deployment container spec should contain:
      """
      env:
        - name: TOA_AMQP_SOURCES_EXTERNAL
          value: amqp://rmq.example.com
      """
