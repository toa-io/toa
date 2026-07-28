Feature: Static routes

  Scenario: Debug
    Given the `messages` component is running with routes:
      """yaml
      created: [sender, recipient]
      """
    And the stream `004e02a959c04cecaf111827f91caa36` is consumed

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

  Scenario: Exposing event properties
    Given the `messages` component is running with routes:
      """yaml
      created:
        key: [sender, recipient]
        expose: [text, sender]
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
        text: Hello!
      """
    And an event is received from the stream `96db5a47a8244eb3b21820781b7d596e`:
      """yaml
      event: default.messages.created
      data:
        sender: 96db5a47a8244eb3b21820781b7d596e
        text: Hello!
      """

  Scenario: Routing an event using array
    Given the `messages` component is running with routes:
      """yaml
      created: watchers
      """
    And the stream `51c15a7290ce47e0af8ec41d60dccb32` is consumed
    And the stream `bb27366509a64178a39313aac42435ae` is consumed
    When the `messages.create` is called with:
      """yaml
      input:
        watchers:
          - 51c15a7290ce47e0af8ec41d60dccb32
          - bb27366509a64178a39313aac42435ae
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then an event is received from the stream `51c15a7290ce47e0af8ec41d60dccb32`:
      """yaml
      event: default.messages.created
      data:
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    And an event is received from the stream `bb27366509a64178a39313aac42435ae`:
      """yaml
      event: default.messages.created
      data:
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """

  Scenario: Continuation token
    Given the `messages` component is running with routes:
      """yaml
      created: [sender, recipient]
      """
    And the stream `004e02a959c04cecaf111827f91caa36` is consumed
    And an event is received from the stream `004e02a959c04cecaf111827f91caa36`:
      """yaml
      event: token
      """

    When the consumer `004e02a959c04cecaf111827f91caa36` is disconnected
    And the `messages.create` is called with:
      """yaml
      input:
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    And the `messages.create` is called with:
      """yaml
      input:
        sender: 004e02a959c04cecaf111827f91caa36
        recipient: 96db5a47a8244eb3b21820781b7d596e
        text: Hi!
      """
    And the consumer `004e02a959c04cecaf111827f91caa36` is reconnected
    Then an event is received from the stream `004e02a959c04cecaf111827f91caa36`:
      """yaml
      event: default.messages.created
      data:
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    And an event is received from the stream `004e02a959c04cecaf111827f91caa36`:
      """yaml
      event: default.messages.created
      data:
        sender: 004e02a959c04cecaf111827f91caa36
        recipient: 96db5a47a8244eb3b21820781b7d596e
        text: Hi!
      """
    And an event is received from the stream `004e02a959c04cecaf111827f91caa36`:
      """yaml
      event: token
      """
