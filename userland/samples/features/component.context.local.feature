Feature: Component local calls samples

  Scenario Outline: Sample with local call passes
    Given I have a sample of `increment` for `math.calculations`:
      """yaml
      title: Increment by 1
      context:
        local:
          add:
            input:
              a: <a>
              b: 1
            output: <sum>
      input: <a>
      output: <sum>
      """
    When I replay it
    Then it passes
    Examples:
      | a | sum |
      | 1 | 2   |
      | 2 | 3   |
      | 1 | 3   |

  Scenario: Sample with actual local call passes
    Given I have a sample of `increment` for `math.calculations`:
      """yaml
      title: Increment by 1
      context:
        local:
          add:
            input:
              a: 1
              b: 1
      input: 1
      output: 2
      """
    When I replay it
    Then it passes

  Scenario: Sample with no call input validation passes
    Given I have a sample of `increment` for `math.calculations`:
      """yaml
      title: Increment by 1
      context:
        local:
          add:
            output: 2
      input: 1
      output: 2
      """
    When I replay it
    Then it passes

  Scenario: Sample with local call fails on call mismatch
    Given I have a sample of `increment` for `math.calculations`:
      """yaml
      title: Increment by 1
      context:
        local:
          add:
            input:
              a: 1
              b: 2
      input: 2
      output: 2
      """
    When I replay it
    Then it fails

  Scenario: Sample with local call fails on reply mismatch
    Given I have a sample of `increment` for `math.calculations`:
      """yaml
      title: Increment by 1
      context:
        local:
          add:
            output: 1
      input: 2
      output: 2
      """
    When I replay it
    Then it fails
