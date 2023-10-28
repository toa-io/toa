Feature: Static routes

  Scenario: Routing an event
    Given the `messages` component is running with routes:
      """yaml
      created: [sender, recipient]
      """
    And the stream `004e02a959c04cecaf111827f91caa36` is consumed
    And the stream `96db5a47a8244eb3b21820781b7d596e` is consumed
    When the `messages.create` is called with:
      """yaml
      input:
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then an event is received from the stream `004e02a959c04cecaf111827f91caa36`:
      """yaml
      event: default.messages.created
      data:
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    And an event is received from the stream `96db5a47a8244eb3b21820781b7d596e`:
      """yaml
      event: default.messages.created
      data:
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
