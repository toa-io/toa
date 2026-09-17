@deployment
Feature: What a context has to state

  A context is deployed as a chart, and a chart is named and versioned. What is missing is
  refused before anything is built, naming the file that has to say it.

  Background:
    Given I have a component `dummies.one`

  Scenario: A context that states no version is refused

  A context is read for a local run too, which needs no chart, so this is asked for where the
  chart is declared rather than where the context is.

    Given I have a context
    And the context has no `version` annotation
    Then exporting deployment fails with:
      """
      Context 'collection' declares no version, which is what its chart is versioned by. Declare it in context.toa.yaml.
      """

  Scenario: A context that states no registry is refused
    Given I have a context
    And the context has no `registry` annotation
    Then exporting deployment fails with:
      """
      context.toa.yaml: must have required property 'registry'
      """
