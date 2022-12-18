Feature: Component storage samples

  Scenario: Update state
    Given I have a sample for transit operation of tea.pots:
      """yaml
      input:
        material: steel
      current:
        material: glass
        volume: 1.5
      next:
        material: steel
        volume: 1.5
      """
    When I replay it
    Then it passes

  Scenario: Create new object
    Given I have a sample for transit operation of tea.pots:
      """yaml
      input:
        material: steel
        volume: 2
      next:
        material: steel
        volume: 2
        _version: 0
      """
    When I replay it
    Then it passes

  Scenario: Partial match is passing
    Given I have a sample for transit operation of tea.pots:
      """yaml
      input:
        material: ceramic
      current:
        material: glass
        volume: 1.5
      next:
        material: ceramic
      """
    When I replay it
    Then it passes

  Scenario: Incorrect next state is failing
    Given I have a sample for transit operation of tea.pots:
      """yaml
      input:
        material: steel
      current:
        material: glass
        volume: 1.5
      next:
        material: glass
        volume: 1.5
      """
    When I replay it
    Then it fails

  Scenario: Incorrect current state is failing
    Given I have a sample for transit operation of tea.pots:
      """yaml
      input:
        material: steel
      current:
        material: not-a-material
      """
    When I replay it
    Then it fails
