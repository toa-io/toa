Feature: Remote call samples

  Remote call samples are defined and replayed in the same way as local. See
  `component.context.local` features for details.

  Scenario: Sample with remote call passes
    Given I have a sample of `add` for `math.proxy`:
      """yaml
      title: Should add numbers
      input:
        a: 1
        b: 2
      output: 3
      remote:
        math.calculations.add:
          input:
            a: 1
            b: 2
          output: 3
      """
    When I replay it
    Then it passes
