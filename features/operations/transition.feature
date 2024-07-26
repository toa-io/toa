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
    When I call `dummies.one.transit`
    Then the reply is received:
      """
      foo: 0
      """

  Scenario: Transition of an associated deleted entry
    Given I compose `mongo.associated` component

    # restore
    When I call `mongo.associated.assign` with:
      """yaml
      query:
        id: efc5e75ae3324622a542d060c5bfb923
      """

    # create or update
    When I call `mongo.associated.transit` with:
      """yaml
      input:
        foo: 1
        bar: baz
      query:
        id: efc5e75ae3324622a542d060c5bfb923
      """
    Then the reply is received

    When I call `mongo.associated.terminate` with:
      """yaml
      query:
        id: efc5e75ae3324622a542d060c5bfb923
      """
    Then the reply is received

    # update deleted
    When I call `mongo.associated.transit` with:
      """yaml
      input:
        foo: 2
        bar: foo
      query:
        id: efc5e75ae3324622a542d060c5bfb923
      """
    Then the following exception is thrown:
      """
      code: 302
      """

    # observe deleted
    When I call `mongo.associated.observe` with:
      """yaml
      query:
        id: efc5e75ae3324622a542d060c5bfb923
      """
    Then the reply is received:
      """
      null
      """
