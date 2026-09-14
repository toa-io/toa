Feature: Discovery asks for a named version

  Two versions of one component serve at once for as long as a deployment takes to replace it,
  and both take lookups. Which of them answers is the map's to say.

  Background:
    Given calls within this process go through the broker

  Scenario: A lookup is answered by the version the map names
    Given the component map names:
      | discovery.next |
    When I compose `discovery.peer` component
    And I compose `discovery.next` component
    And I call `discovery.peer.added`
    Then the reply is received:
      """yaml
      next
      """

  Scenario: A version the map does not name does not answer
    Given the component map names:
      | discovery.peer |
    When I compose `discovery.peer` component
    And I compose `discovery.next` component
    And I call `discovery.peer.added`
    Then the following exception is thrown:
      """yaml
      message: "EndpointException: 'added' is not provided by 'discovery.peer'"
      """

  Scenario: A version that is not up yet is waited for
    Given the component map names:
      | discovery.next |
    When I compose `discovery.peer` component
    And I call `discovery.peer.added` without waiting with:
      """yaml
      {}
      """
    Then the pending reply is not received yet
    When I compose `discovery.next` component
    Then the pending reply is received

  Scenario: A receiver is bound at the version the map names
    Given the component map names:
      | discovery.next |
    When I compose `discovery.peer` component
    And I compose `discovery.next` component
    And I compose `discovery.caller` component
    And I call `discovery.peer.added`
    Then the reply is received:
      """yaml
      next
      """

  Scenario: A receiver on an event the named version does not declare
    Given the component map names:
      | discovery.peer |
    When I compose `discovery.peer` component
    Then I compose `discovery.caller` component and it fails with a message containing:
      """
      declares no event 'appeared', which is what 'discovery.peer.appeared' receives
      """
