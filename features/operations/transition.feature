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

  Scenario: Undelete
    Given I compose `mongo.associated` component

    When I call `mongo.associated.assign` with:
      """yaml
      query:
        id: 12317562d0504f8a9a84d330b4ed2699
      """

    When I call `mongo.associated.terminate` with:
      """yaml
      query:
        id: 12317562d0504f8a9a84d330b4ed2699
      """
    Then the reply is received

    # observe deleted
    When I call `mongo.associated.observe` with:
      """yaml
      query:
        id: 12317562d0504f8a9a84d330b4ed2699
        deleted: true
      """
    Then the reply is received:
      """
      id: 12317562d0504f8a9a84d330b4ed2699
      """

    # update deleted
    When I call `mongo.associated.undelete` with:
      """yaml
      input:
        foo: 2
        bar: foo
      query:
        id: 12317562d0504f8a9a84d330b4ed2699
        deleted: true
      """
    Then the reply is received:
      """
      id: 12317562d0504f8a9a84d330b4ed2699
      """

    # now undeleted
    When I call `mongo.associated.observe` with:
      """yaml
      query:
        id: 12317562d0504f8a9a84d330b4ed2699
      """
    Then the reply is received:
      """
      id: 12317562d0504f8a9a84d330b4ed2699
      """

  Scenario: Transition guards
    # guard: `b` must be greater than `a`
    Given I compose `transition.guards` component
    When I call `transition.guards.transit` with:
      """yaml
      input:
        a: 1
        b: 2
      """
    Then the reply is received:
      """
      a: 1
      b: 2
      """
    When I call `transition.guards.transit` with:
      """yaml
      input:
        a: 2
        b: 1
      """
    Then the following exception is thrown:
      """
      code: 213
      message: less
      cause:
        a: 2
        b: 1
      """
      
  @manual
  Scenario: Objects scope transition
    Given I compose `mongo.associated` component
    When I call `mongo.associated.increment` with:
      """yaml
      input:
        foo: 2
      query:
        ids:
          - 519b01a368f743bfac5d4e1f54f42856
          - 9d31744d50cb4e4e992a87331350e93e
          - 78fe640de1d14e698f56853903478af5
      """
    Then the reply is received:
      """
      total: 6
      """
