Feature: Processes of one context on one broker

  A process given a suffix names every exchange and queue after its scope, so processes of one
  context with different suffixes share a virtual host without sending each other anything. The
  scenarios boot both in one process, changing the suffix between them.

  Background:
    Given calls within this process go through the broker

  Scenario: A request is answered within its scope
    Given an environment variable `TOA_SUFFIX` is set to "-one"
    And I compose `echo.beacon` component
    And an environment variable `TOA_SUFFIX` is set to "-two"
    When I call `echo.beacon.echo` without waiting with:
      """yaml
      input: hello
      """
    And I wait 1 second
    Then the pending reply is not received yet
    When I compose `echo.beacon` component
    Then the pending reply is received

  Scenario: An event is received within its scope
    Given the `mongo.receiver` event queues are empty
    And an environment variable `TOA_SUFFIX` is set to "-one"
    And the `mongo.receiver` database in "toa-dev-one" contains:
      | _id                              | count | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0     | 1       |
    And the `mongo.one` database in "toa-dev-one" contains:
      | _id                              | foo | bar   | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1       |
    And I compose components:
      | mongo.one      |
      | mongo.receiver |
    And an environment variable `TOA_SUFFIX` is set to "-two"
    And the `mongo.receiver` database in "toa-dev-two" contains:
      | _id                              | count | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0     | 1       |
    And the `mongo.one` database in "toa-dev-two" contains:
      | _id                              | foo | bar   | VERSION |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1       |
    And I compose components:
      | mongo.one      |
      | mongo.receiver |
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: world
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    And I wait 1 second
    Then the `mongo.receiver` collection in "toa-dev-two" holds:
      | _id                              | count |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 1     |
    And the `mongo.receiver` collection in "toa-dev-one" holds:
      | _id                              | count |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0     |

  Scenario: Names begin with the scope
    Given an environment variable `TOA_SUFFIX` is set to "-one"
    When I compose `echo.beacon` component
    Then the queue "toa-dev-one.echo.beacon.echo" is consumed
    And the queue "echo.beacon.echo" is not consumed

  Scenario: Names are unchanged without a suffix
    When I compose `echo.beacon` component
    Then the queue "echo.beacon.echo" is consumed
