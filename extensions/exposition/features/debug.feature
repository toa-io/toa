Feature: Debugging

  Scenario: Operation call
    Given the `identity.basic` database contains:
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role      |
      | 775a648d054e4ce1a65f8f17e5b51803 | efe3a65ebbee47ed95a73edd911ea328 | developer |
    And the annotation:
      """yaml
      debug: true
      """
    And the `greeter` is running with the following manifest:
      """yaml
      exposition:
        /:
          auth:role: developer
          io:output: true
          GET: greet
      """
    When the following request is received:
      """
      GET /greeter/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello
      """
