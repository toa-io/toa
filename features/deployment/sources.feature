@deployment
Feature: What the sources image carries

  Scenario: A component carries the sources it links
    Given I have a component `dummies.one`
    And `dummies.one` links sources of the workspace
    And I have a context
    When I export images
    Then the file ./images/*/dummies-one/shared/linked.js contains exact line "export const linked = 'the linked source'"
    And nothing under ./images/composition-* is a link
