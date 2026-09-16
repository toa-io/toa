@deployment
Feature: Streamed calls deployment

  Background:
    Given I have a component `streams.remote`

  Scenario: Deploy a context that states where a component answers
    Given I have a context with:
      """yaml
      http:
        streams.remote: http://streams-remote:8005
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: streams-remote
          variables:
            - name: TOA_HTTP
              value: '{"streams.remote":"http://streams-remote:8005"}'
      """

  Scenario: Deploy a context that states none
    Given I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: streams-remote
          variables:
            - name: TOA_HTTP
              value: '{}'
      """
