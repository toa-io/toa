Feature: Stream scope

  Background:
    # the scenario counts what it has written, so it starts from an empty collection
    Given the `operations.streams` database contains:
      | _id | foo | bar | VERSION |
    And I compose `operations.streams` component

  Scenario: Getting a stream
    When I call `operations.streams.transit` 2000 times with:
      """yaml
      input:
        foo: 3
        bar: hello
      """
    And I read `operations.streams.extract` with:
      """yaml
      query:
        sort: [CREATED:desc]
      """
    Then the stream ended with no position to continue from
    And the copy holds 2000 entries
    When I read `operations.streams.stream` with:
      """yaml
      query:
        sort: [CREATED:desc]
      """
    Then the stream ended with no position to continue from
    And the copy holds 2000 entries
