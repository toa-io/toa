Feature: Local call samples

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
      input:
        value: <a>
      output: <sum>
      """
    When I replay it
    Then it passes
    Examples:
      | a | sum |
      | 1 | 2   |
      | 2 | 3   |
      | 1 | 3   |

  Scenario: Calls sample can be array

  Because of `times: 2` argument `increment` calls `add` twice.

    Given I have a sample of `increment` for `math.calculations`:
      """yaml
      title: Increment by 1
      context:
        local:
          add:
            - input:
                a: 2
                b: 1
              output: 3
            - input:
                a: 3
                b: 1
              output: 4
      input:
        value: 2
        times: 2
      output: 4
      """
    When I replay it
    Then it passes

  Scenario: Sample with actual local call passes

  If context local call does not contain output, when input will be verified, the actual call will be performed.

    Given I have a sample of `increment` for `math.calculations`:
      """yaml
      title: Increment by 1
      context:
        local:
          add:
            input:
              a: 1
              b: 1
      input:
        value: 1
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
      input:
        value: 1
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
      input:
        value: 2
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
      input:
        value: 2
      output: 2
      """
    When I replay it
    Then it fails
