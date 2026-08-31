Feature: Stream scope

  Background:
    # the scenario counts what it has written, so it starts from an empty collection
    Given the `operations.streams` database contains:
      | _id | foo | bar | _version |
    And I compose `operations.streams` component

  Scenario: Getting a stream
    When I call `operations.streams.transit` 2000 times with:
      """yaml
      input:
        foo: 3
        bar: hello
      """
    And I call `operations.streams.extract` with:
      """yaml
      query:
        sort: [_created:desc]
      """
    Then the stream of 2000 items is received
    When I call `operations.streams.stream` with:
      """yaml
      query:
        sort: [_created:desc]
      """
    Then the stream of 2000 items is received
