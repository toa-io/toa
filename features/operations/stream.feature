Feature: Stream scope

  @skip # run this once
  Scenario: Prepare data
    And I call `operations.streams.transit` 2000 times with:
      """yaml
      input:
        foo: 3
        bar: hello
      """

  @skip
  Scenario: Getting a stream
    Given I compose `operations.streams` component
    When I call `operations.streams.extract` with:
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
