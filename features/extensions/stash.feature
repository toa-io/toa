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

  Scenario: Keys begin with the context
    Given I boot `stash` component
    When I invoke `set` with:
      """yaml
      input: scoped
      """
    Then Redis holds "scoped" under "toa-dev:default:stash:key"

  Scenario: Keys begin with the context and the suffix
    Given an environment variable `TOA_SUFFIX` is set to "-copy"
    And I boot `stash` component
    When I invoke `set` with:
      """yaml
      input: copied
      """
    Then Redis holds "copied" under "toa-dev-copy:default:stash:key"

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
