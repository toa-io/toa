Feature: Component IO samples

  Scenario: Correct IO sample is passing
    Given I have a sample of `add` for `math.calculations`:
      """yaml
      title: Sum 1 and 2
      input:
        a: 1
        b: 2
      output: 3
      """
    When I replay it
    Then it passes

  Scenario: Correct multiple IO samples are passing
    Given I have samples of `add` for `math.calculations`:
      """
      input:
        a: 1
        b: 2
      output: 3
      ---
      input:
        a: 10
        b: 20
      output: 30
      """
    When I replay it
    Then it passes

  Scenario: Incorrect IO sample is failing
    Given I have a sample of `add` for `math.calculations`:
      """yaml
      input:
        a: 1
        b: 2
      output: 1
      """
    When I replay it
    Then it fails
