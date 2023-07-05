Feature: Pointer

  Scenario: Deploy a default URL
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis.example.com
      """

  Scenario: Deploy default URL set
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash:
        - redis://redis0.example.com
        - redis://redis1.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis0.example.com redis://redis1.example.com
      """

  Scenario Outline: Deploy a URL for a <type>
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash:
        <key>: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis.example.com
      """
    Examples:
      | type      | key           |
      | component | default.stash |
      | namespace | default       |


  Scenario: Credentials for AMQP binding
    Given I have a component `dummies.one`
    And I have a context with:
      """
      amqp:
        .: amqp://default.example.com
        system: amqp://system.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        global:
          - name: TOA_AMQP_SYSTEM_USERNAME
            secret:
              name: toa-amqp-system
              key: username
          - name: TOA_AMQP_SYSTEM_PASSWORD
            secret:
              name: toa-amqp-system
              key: password
          - name: TOA_AMQP_DUMMIES_ONE_USERNAME
            secret:
              name: toa-amqp.default
              key: username
          - name: TOA_AMQP_DUMMIES_ONE_PASSWORD
            secret:
              name: toa-amqp.default
              key: password
      """
