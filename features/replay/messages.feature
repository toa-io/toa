Feature: Message samples

  Scenario: Sample passes
    Given I have a message sample labeled store.orders.created for tea.pots:
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

    Given I have a message sample labeled store.orders.created for tea.pots:
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

  Scenario: Sample fails
    Given I have a message sample labeled store.orders.created for tea.pots:
      """yaml
      title: Should not work
      payload:
        pot: 1
      input:
        booked: false
      """
    When I replay it
    Then it fails

  Scenario: Sample with blocked request passes
    Given I have a message sample labeled store.orders.created for tea.post:
      """yaml
      title: Should book a pot (without request)
      component: tea.pots
      payload:
        pot: 1
      input:
        booked: true
      query:
        id: 1
      request: ~
      """
    When I replay it
    Then it passes

  Scenario: Sample with request sample passes
    Given I have a message sample labeled store.order.created for tea.pots:
      """yaml
      title: Should book a pot (with request sample)
      payload:
        pot: 1
      input:
        booked: true
      query:
        id: 1
      request:
        current:
          id: 1
          booked: false
        next:
          id: 1
          booked: true
      """
    When I replay it
    Then it passes

  Scenario: Message without output but with request passes
    Given I have a message sample labeled store.orders.created for tea.pots:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      request:
        current:
          id: 1
          booked: false
        next:
          id: 1
          booked: true
      """
    When I replay it
    Then it passes

  Scenario: Message without output and request is incorrect
    Given I have a message sample labeled store.orders.created for tea.pots:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      """
    When I replay it
    Then it fails
