Feature: A contract is what a caller is given

  What a component provides is stated by whoever knows which version of it is meant: the process
  itself, for what it composes, and the map for everything else.

  Background:
    Given calls within this process go through the broker

  Scenario: A caller is held to the contract the map states
    Given the component map states:
      | contracts.next |
    When I compose `contracts.peer` component
    And I compose `contracts.next` component
    And I call `contracts.peer.added`
    Then the reply is received:
      """yaml
      next
      """

  Scenario: An operation the stated version does not declare is not called
    Given the component map states:
      | contracts.peer |
    When I compose `contracts.peer` component
    And I compose `contracts.next` component
    And I call `contracts.peer.added`
    Then the following exception is thrown:
      """yaml
      message: "EndpointException: 'added' is not provided by 'contracts.peer'"
      """

  Scenario: A call to a component that is not up yet waits for it
    Given the component map states:
      | contracts.next |
    When I compose `contracts.peer` component
    And I call `contracts.peer.added` without waiting with:
      """yaml
      {}
      """
    Then the pending reply is not received yet
    When I compose `contracts.next` component
    Then the pending reply is received

  Scenario: A receiver is bound at the version the map states
    Given the component map states:
      | contracts.next |
    When I compose `contracts.peer` component
    And I compose `contracts.next` component
    And I compose `contracts.caller` component
    And I call `contracts.peer.added`
    Then the reply is received:
      """yaml
      next
      """

  Scenario: A receiver on an event the stated version does not declare
    Given the component map states:
      | contracts.peer |
    When I compose `contracts.peer` component
    Then I compose `contracts.caller` component and it fails with a message containing:
      """
      declares no event 'appeared', which is what 'contracts.peer.appeared' receives
      """

  Scenario: A composition boots before the component whose event it receives
    Given the component map states:
      | contracts.next |
    When I compose `contracts.caller` component
    And I compose `contracts.next` component
    And I call `contracts.peer.added`
    Then the reply is received:
      """yaml
      next
      """

  Scenario: A component composed beside its caller is called where the map states neither
    When I compose components:
      | contracts.next |
      | contracts.caller |
    And I call `contracts.peer.added`
    Then the reply is received:
      """yaml
      next
      """

  Scenario: A call to a component nothing states is refused
    When I call `contracts.peer.added`
    Then the following exception is thrown:
      """yaml
      message: "UnstatedException: Cannot call 'contracts.peer': the component map states nothing of it. Run `toa map`."
      """
