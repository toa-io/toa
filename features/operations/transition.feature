Feature: Transition

  Scenario: Transition returns created object
    Given I compose `dummies.one` component
    When I call `dummies.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: baz
      """
    Then the reply is received:
      """
      foo: 1
      bar: baz
      """
