Feature: Pushing to realtime streams

  A route with `realtime:push` sends the request body to every reader of a key, as it arrives:
  validated against the route's `input`, stamped with the identity that pushed it, stored nowhere and
  followed by no token.

  Background:
    Given the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        # not `/`, whose directives every route of the component inherits
        /posts:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
        /rooms/:room/moves:
          auth:anyone: true
          POST:
            realtime:push:
              key: room
              event: move
              input:
                type: object
                properties:
                  x:
                    type: number
                  y:
                    type: number
                required: [x, y]
                additionalProperties: false
        /rooms/:room/waves:
          anonymous: true
          POST:
            realtime:push:
              key: room
              event: wave
              input:
                type: object
                properties:
                  hand:
                    type: string
        /rooms/:room/flags:
          auth:role: chat:marshal
          POST:
            realtime:push:
              key: room
              event: flag
              input:
                type: object
        /lobby/stream:
          anonymous: true
          GET:
            realtime:stream: ~lobby
        /lobby/waves:
          anonymous: true
          POST:
            realtime:push:
              key: ~lobby
              event: wave
              input:
                type: object
      """

  Scenario: Pushing to the readers of a key
    Given transient identity Bob
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And Carol is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/rooms/general/moves/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ Bob.token }}
      content-type: application/yaml

      x: 10.5
      y: 3
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    And Alice receives the event `move` pushed by Bob:
      """yaml
      x: 10.5
      y: 3
      """
    And Carol receives the event `move` pushed by Bob:
      """yaml
      x: 10.5
      y: 3
      """
    And Alice has been given 1 token

  Scenario: Pushing anonymously
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/rooms/general/waves/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      hand: left
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    And Alice receives the event `wave` pushed anonymously:
      """yaml
      hand: left
      """

  Scenario: Pushing to no reader of another key
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/rooms/random/waves/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      hand: right
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    And Alice receives no event `wave`
    And the stream of `random` does not exist

  Scenario: Not replaying what was pushed
    Given transient identity Bob
    And Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    When Alice disconnects
    And the following request is received:
      """
      POST /chat/messages/rooms/general/moves/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ Bob.token }}
      content-type: application/yaml

      x: 1
      y: 2
      """
    And the following request is received:
      """
      POST /chat/messages/posts/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Missed
      """
    And Alice reconnects
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Missed
      """
    And Alice receives no event `move`
    And the stream of `general` holds 1 event

  Scenario: Refusing what the schema does not admit
    Given transient identity Bob
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/rooms/general/moves/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ Bob.token }}
      content-type: application/yaml

      x: 1
      y: 2
      text: smuggled
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """
    And Alice receives no event `move`

  Scenario: Pushing nothing for a request the route refuses
    Given transient identity Bob
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/rooms/general/flags/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ Bob.token }}
      content-type: application/yaml

      color: red
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    And Alice receives no event `flag`

  Scenario: Pushing to a literal key
    When Alice is consuming:
      """
      GET /chat/messages/lobby/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/lobby/waves/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      hand: both
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    And Alice receives the event `wave` pushed anonymously:
      """yaml
      hand: both
      """

  Scenario: Not pushing to a literal key by a route variable
    When the following request is received:
      """
      POST /chat/messages/rooms/~lobby/waves/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      hand: left
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Refusing a body past the limit
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/rooms/general/waves/ HTTP/1.1
      host: nex.toa.io
      content-type: application/json

      {"hand":"#{{ repeat 65536 }}"}
      """
    Then the following reply is sent:
      """
      413 Request Entity Too Large
      """
    And Alice receives no event `wave`
