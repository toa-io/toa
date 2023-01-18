Feature: Remote call samples

  Remote call samples are defined and replayed in the same way as local. See
  local call samples feature (local.feature) for details.

  Scenario: Sample with remote call passes
    Given I have a sample for `add` operation of `math.proxy`:
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

  Scenario: Autonomous sample with no remote output declaration fails
    Given I have a sample for `add` operation of `math.proxy`:
      """yaml
      title: Should add numbers (actually not)
      input:
        a: 1
        b: 2
      output: 3
      remote:
        math.calculations.add:
          input:
            a: 1
            b: 2
      """
    When I replay it
    Then it fails
