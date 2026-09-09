Feature: A call that has gone round in a circle is refused

  A call carries the chain of hops that led to it, and one that has been where it is going
  already is refused rather than made. Without it a component that calls itself, directly or
  through another, runs until something else gives out.

  Scenario: A component that calls itself
    Given I compose `cycle.recursive` component
    When I call `cycle.recursive.spin` with:
      """yaml
      input:
        note: hello
      """
    Then the following exception is thrown:
      """yaml
      code: 500
      message: "'cycle.recursive.spin' is hop 3 of this chain"
      trail:
        # the suite calls as a service, and a service is where a chain starts
        - features
        - cycle.recursive.spin
        - cycle.recursive.spin
        - cycle.recursive.spin
      """

  Scenario: A chain that repeats nothing is made
    Given I compose components:
      | math.proxy        |
      | math.calculations |
    When I call `math.proxy.sum` with:
      """yaml
      input:
        a: 1
        b: 2
      """
    Then the reply is received:
      """yaml
      3
      """

  Scenario: Concurrent calls handed one request object are not a circle
    Given I compose components:
      | cycle.recursive   |
      | math.calculations |
    When I call `cycle.recursive.fan` with:
      """yaml
      input:
        note: hello
      """
    Then the reply is received:
      """yaml
      - 3
      - 3
      - 3
      """
