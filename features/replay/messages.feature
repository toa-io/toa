Feature: Message samples

  Scenario: Sample passes
    Given I have a message `store.orders.created` sample for `tea.pots`:
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
    Given I have a message `store.orders.created` sample for `tea.pots`:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      query:
        id: 1
      """
    When I replay it
    Then it passes

  Scenario: False sample fails
    Given I have a message `store.orders.created` sample for `tea.pots`:
      """yaml
      title: Should not work
      payload:
        pot: 1
      input:
        booked: false
      """
    When I replay it
    Then it fails

  Scenario: Samp    le with blocked request passes
    Given I have a message `store.orders.created` sample for `tea.pots`:
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
    Given I have a message `store.orders.created` sample for `tea.pots`:
      """yaml
      title: Should book a pot (with request sample)
      payload:
        pot: 7aa9b2302a854a9aaaa292159a9d1b70
      input:
        booked: true
      query:
        id: 7aa9b2302a854a9aaaa292159a9d1b70
      request:
        current:
          id: 7aa9b2302a854a9aaaa292159a9d1b70
          material: glass
          booked: false
        next:
          id: 7aa9b2302a854a9aaaa292159a9d1b70
          material: glass
          booked: true
      """
    When I replay it
    Then it passes

  Scenario: Message without output but with request passes
    Given I have a message `store.orders.created` sample for `tea.pots`:
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
    Given I have a message `store.orders.created` sample for `tea.pots`:
      """yaml
      title: Should book a pot
      payload:
        pot: 1
      """
    When I replay it
    Then it fails
