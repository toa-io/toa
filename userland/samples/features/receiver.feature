Feature: Receiver samples

  Scenario: Sample passes
    Given I have a message sample `store.orders.created` for `tea.pots`:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      input:
        booked: true
      query:
        id: 1
      """
    When I replay it
    Then it passes

  Scenario: Partial sample passes

    Given I have a message sample `store.orders.created` for `tea.pots`:
      """yaml
      title: Should book a pot
      component: tea.pots # autonomous sample may contain component's name
      payload:
        pot: 1
      query:
        id: 1
      """
    When I replay it
    Then it passes

  Scenario: Simple wrong sample fails
    Given I have a message sample `store.orders.created` for `tea.pots`:
      """yaml
      title: Should not work
      payload:
        pot: 1
      input:
        booked: false
      """
    When I replay it
    Then it passes

  Scenario: Sample with blocked invocation passes
    Given I have a message sample `store.orders.created` for `tea.post`:
      """yaml
      title: Should book a pot (without invocation)
      component: tea.pots
      payload:
        pot: 1
      input:
        booked: true
      query:
        id: 1
      invocation: ~
      """
    When I replay it
    Then it passes

  Scenario: Message sample with invocation sample
    Given I have a message sample `store.order.created` for `tea.pots`:
      """yaml
      title: Should book a pot (with invocation sample)
      payload:
        pot: 1
      input:
        booked: true
      query:
        id: 1
      invocation:
        current:
          id: 1
          booked: false
        next:
          id: 1
          booked: true
      """
    When I replay it
    Then it passes

  Scenario: Message sample with invocation input fails
    Given I have a message sample `store.orders.created` for `tea.pots`:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      input:
        booked: true
      query:
        id: 1
      invocation:
        input:
          booked: true
      """
    When I replay it
    Then it fails

  Scenario: Message without output and with invocation passes
    Given I have a message sample `store.orders.created` for `tea.pots`:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      invocation:
        current:
          id: 1
          booked: false
        next:
          id: 1
          booked: true
      """
    When I replay it
    Then it passes

  Scenario: Message without output and invocation is incorrect
    Given I have a message sample `store.orders.created` for `tea.pots`:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      """
    When I replay it
    Then it fails

  Scenario: Sample with incorrect component's name fails
    Given I have a message sample `store.orders.created` for `tea.pots`:
      """yaml
      title: Should book a pot
      component: tea.glasses
      payload:
        pot: 1
      input:
        booked: true
      """
    When I replay it
    Then it fails
