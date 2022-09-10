Feature: Component storage samples

  Scenario: Storage object update
    Given I have a samples of `transit` for `tea.pots`:
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

  Scenario: Incorrect next state is failing
    Given I have a samples of `transit` for `tea.pots`:
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
