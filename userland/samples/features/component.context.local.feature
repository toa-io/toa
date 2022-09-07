Feature: Component local context call samples

  Scenario Outline: Sample with local context call is passing
    Given I have a samples of `increment` for `math.calculations`:
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
