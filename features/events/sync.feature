Feature: Sync event

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0   | hello | 1        |
    And the `mongo.receiver` database contains:
      | _id                              | count | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 0     | 1        |

  Scenario: Receiving sync events
    Given I compose components:
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
    And I call `mongo.receiver.observe` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      """
    Then the reply is received:
      """yaml
      count: 1
      """
