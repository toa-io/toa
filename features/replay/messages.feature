Feature: Message samples

  Scenario: Samples pass
    Given I have message `store.orders.created` samples for `tea.pots`:
      """
      title: Should book a pot
      payload:
        pot: 7aa9b2302a854a9aaaa292159a9d1b70
      input:
        booked: true
      query:
        id: 7aa9b2302a854a9aaaa292159a9d1b70
      ---
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

  Scenario: Partial sample passes
    Given I have a message `store.orders.created` sample for `tea.pots`:
      """yaml
      title: Should book a pot
      payload:
        pot: 7aa9b2302a854a9aaaa292159a9d1b70
      query:
        id: 7aa9b2302a854a9aaaa292159a9d1b70
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
        pot: 7aa9b2302a854a9aaaa292159a9d1b70
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
