Feature: Stash extension

  Scenario: Using stash
    Given I boot `stash` component
    When I invoke `set` with:
      """yaml
      input: hello
      """
    When I invoke `get`
    Then the reply is received:
      """yaml
      hello
      """

  Scenario: Storing an object
    Given I boot `stash` component
    When I invoke `store` with:
      """yaml
      input:
        foo: bar
      """
    When I invoke `fetch`
    Then the reply is received:
      """yaml
      foo: bar
      """

  Scenario: Storing an array
    Given I boot `stash` component
    When I invoke `store` with:
      """yaml
      input: [foo, bar]
      """
    When I invoke `fetch`
    Then the reply is received:
      """yaml
      [foo, bar]
      """

  Scenario: Using increment
    Given I boot `stash` component
    When I invoke `del` with:
      """yaml
      input: num
      """
    And I invoke `inc` with:
      """yaml
      input: num
      """
    Then the reply is received:
      """yaml
      1
      """

  Scenario: Using DLM
    Given I compose `stash` component
    When I call `default.stash.set` with:
      """yaml
      input: 0
      """
    And I call `default.stash.locks` with:
      """yaml
      input: {}
      """
    Then the reply is received:
      """yaml
      [1, 2]
      """

  Scenario: Using DLM with delay
    Given I compose `stash` component
    When I call `default.stash.set` with:
      """yaml
      input: 0
      """
    And I call `default.stash.locks` with:
      """yaml
      input:
        delay: 5000
      """
    Then the reply is received:
      """yaml
      [1, 2]
      """

  Scenario: Deployment
    Given I have a component `stash`
    And I have a context with:
      """
      stash: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-stash
          variables:
            - name: TOA_STASH_DEFAULT_STASH
              value: redis://redis.example.com
      """

  Scenario: Invoke operation with environment
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash: redis://localhost
      """
    And I run `toa env`
    And my working directory is ./components/stash
    When I run `toa invoke set "{ input: 'foo' }"`
    Then program should exit with code 0

  Scenario: Using DLM with multiple Redises
    Given I have a component `stash`
    And I have a context with:
      """yaml
      amqp: amqp://localhost
      stash:
        - redis://localhost:6379
        - redis://localhost:6378
        - redis://localhost:6377
      """
    And I run `toa env`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """
    And my working directory is ./components/stash
    When I run `TOA_DEV=0 toa invoke set "{ input: 0 }"`
    And I run `TOA_DEV=0 toa invoke locks "{ input: {} }"`
    Then program should exit with code 0

  Scenario: Invoke operation with multiple connections
    Given I have a component `stash`
    And I have a context with:
      """yaml
      amqp: amqp://localhost
      stash:
        - redis://localhost:6379
        - redis://localhost:6378
        - redis://localhost:6377
      """
    And I run `toa env`
    And I update an environment with:
      """
      TOA_DEV=0
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      TOA_AMQP_DEFAULT_STASH_USERNAME=developer
      TOA_AMQP_DEFAULT_STASH_PASSWORD=secret
      """
    And my working directory is ./components/stash
    When I run `TOA_DEV=0 toa invoke set "{ input: 'foo' }"`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Stash connected to localhost:6377
      Stash connected to localhost:6378
      Stash connected to localhost:6379
      """
