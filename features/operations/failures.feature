Feature: Operations failures

  Scenario: Object `id` is readonly
    Given I have a component `errors.caller`
    And my working directory is ./components/errors.caller
    When I run `toa invoke setid "{}"`
    Then stderr should contain lines:
    """
    <...>Cannot assign to read only property 'id'
    """

  Scenario: Failed observation
    Given I compose `mongo.one` component
    When I call `mongo.one.observe` with:
      """yaml
      query:
        id: 953c83b370f940408b2a2a924d2b4449
      """
    Then the reply is received:
      """yaml
      null
      """

  Scenario: Failed transition
    Given I compose `mongo.one` component
    When I call `mongo.one.transit` with:
      """yaml
      query:
        id: 953c83b370f940408b2a2a924d2b4449
      input:
        bar: hello
      """
    Then the following exception is thrown:
      """yaml
      code: 302
      """
