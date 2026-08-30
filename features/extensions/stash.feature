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

  # The assertion is on the number counting returns, which is local by design.
  # The wait is what lets the buffer reach Redis before the component shuts down,
  # so the scenario exercises the flush even though it cannot assert on it: the
  # group's total only becomes readable an interval later, and which interval a
  # fixed wait lands in depends on where in the current one the run started.
  Scenario: Counting
    Given I boot `stash` component
    When I invoke `count` with:
      """yaml
      input:
        name: bursts
        times: 3
      """
    Then the reply is received:
      """yaml
      3
      """
    When I wait 0.5 second
