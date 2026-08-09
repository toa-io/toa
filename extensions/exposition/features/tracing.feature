Feature: Distributed tracing

  Background:
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST: create
      """

  Scenario: Response carries the `ray` header
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      ray:
      """

  Scenario: Trace is continued from the `traceparent` request header
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      ray: 0af7651916cd43dd8448eb211c80319c
      """

  Scenario: Trace is continued from the `ray` request header
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      ray: 4bf92f3577b34da6a3ce929d0e0e4736

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      ray: 4bf92f3577b34da6a3ce929d0e0e4736
      """

  Scenario: Trace spans remote calls, storage and events
    Given the `identity.basic` database is empty
    And the `pricing` is running
    And the `orders` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          auth:id: id
          POST: create
      """
    And the `audit` is running
    And the `notify` is running
    When the following request is received:
      """
      POST /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNzMTIzNA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      id: ${{ id }}
      roles: []
      """
    When the following request is received:
      """
      POST /orders/${{ id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ token }}
      content-type: application/yaml

      title: Kettle
      volume: 2
      """
    Then the following reply is sent:
      """
      201 Created
      ray:
      """

  Scenario: Invalid `traceparent` starts a new trace
    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml
      traceparent: not-a-valid-traceparent

      title: Hello
      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created
      ray:
      """
    And the reply does not contain:
      """
      ray: 0af7651916cd43dd8448eb211c80319c
      """
