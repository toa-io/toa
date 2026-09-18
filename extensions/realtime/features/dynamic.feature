Feature: Dynamic routes

  Scenario: Routing an event by a dynamic route
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: random
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Elsewhere
      """
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        room: general
        text: Hello!
      """
    And no event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Elsewhere
      """

  Scenario: Routing by a value in an array
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      property: watchers
      value: 51c15a7290ce47e0af8ec41d60dccb32
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        watchers: [bb27366509a64178a39313aac42435ae, 51c15a7290ce47e0af8ec41d60dccb32]
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """

  Scenario: Routing every event of a kind
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: random
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Elsewhere
      """
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """
    And an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Elsewhere
      """

  Scenario: Keeping the static routes of a dynamic event
    Given the `messages` component is running with routes:
      """yaml
      created:
        key: recipient
        dynamic: true
      """
    And the stream `004e02a959c04cecaf111827f91caa36` is consumed
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then an event is received from the stream `004e02a959c04cecaf111827f91caa36`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """
    And an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """

  Scenario: Exposing what the declaration allows
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic:
          expose: [room, text]
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then exactly this event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        room: general
        text: Hello!
      """

  Scenario: Exposing less than the declaration allows
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic:
          expose: [room, text]
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      expose: [text]
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then exactly this event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """

  Scenario: Exposing beyond the declaration
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic:
          expose: [room, text]
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      expose: [text, sender]
      """
    Then the route is refused with `EXPOSE`

  Scenario: Routing an event not declared dynamic
    Given the `messages` component is running with routes:
      """yaml
      created: recipient
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    Then the route is refused with `NOT_DYNAMIC`

  Scenario: Creating a route twice
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then 1 event `default.messages.created` is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`

  Scenario: Removing a route
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    When the route is removed:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then 0 events `default.messages.created` are received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`

  Scenario: Replaying what a route pushed
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: token
      """
    And the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    When the consumer `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is disconnected
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    And the consumer `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is reconnected
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """

  Scenario: Serving a route created on another replica
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And another replica of the service is running
    When the route is created on the other replica:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """

  Scenario: Keeping routes over a restart of the service
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    When the service is restarted
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """

  @containers
  Scenario: Routes created while the stash restarts
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And another replica of the service is running
    When the stash is restarted
    And the route is created on the other replica:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Hello!
      """
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Hello!
      """

  @containers
  Scenario: Creating a route while the stash is down
    Given the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    When the stash is stopped
    And the route is created:
      """yaml
      event: default.messages.created
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    Then the route is refused with a system exception

  @timing
  Scenario: Outliving the consumer for its expiry
    Given the streams expire in 3 seconds
    And the `messages` component is running with routes:
      """yaml
      created:
        dynamic: true
      """
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And the route is created:
      """yaml
      event: default.messages.created
      property: room
      value: general
      stream: a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8
      """
    When 5 seconds have passed
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Consumed
      """
    And the consumer `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is disconnected
    And 1 second has passed
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: Within
      """
    And the consumer `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is reconnected
    Then an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Consumed
      """
    And an event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: Within
      """
    When the consumer `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is disconnected
    And 5 seconds have passed
    And the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8` is consumed
    And the `messages.create` is called with:
      """yaml
      input:
        room: general
        sender: 96db5a47a8244eb3b21820781b7d596e
        recipient: 004e02a959c04cecaf111827f91caa36
        text: After
      """
    Then no event is received from the stream `a4b8e7e8a4b8e7e8a4b8e7e8a4b8e7e8`:
      """yaml
      event: default.messages.created
      data:
        text: After
      """
