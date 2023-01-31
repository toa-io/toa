Feature: Context level samples

  Scenario: Sample is passing
    Given I have integration samples of `math.proxy.add` operation:
      """
      title: Sum 1 and 2
      input:
        a: 1
        b: 2
      output: 3
      ---
      title: Sum -1 and 1
      input:
        a: -1
        b: 1
      output: 0
      """
    When I replay it
    Then it passes

  Scenario: False sample is failing
    Given I have an integration sample of `math.proxy.add` operation:
      """
      title: Sum 1 and 2
      input:
        a: 1
        b: 2
      output: 4
      """
    When I replay it
    Then it fails

  Scenario: Sample with remote call substitution is passing
    Given I have an integration sample of `math.proxy.add` operation:
      """
      title: Sum 1 and 2
      input:
        a: 1
        b: 2
      output: 4
      remote:
        math.calculations.add: 4 # collapsed output declaration
      """
    When I replay it
    Then it passes
