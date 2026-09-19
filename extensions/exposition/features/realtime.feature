Feature: Realtime streams

  A route with `realtime:stream` answers with the stream of the key a route variable names. Who may
  read it is what the route's own directives say.

  Scenario: Getting realtime events
    Given the identity Bob is consuming realtime events
    And the `users.properties` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: id
          expose: [newbie]
      exposition:
        /:id:
          anonymous: true
          io:output: false
          PATCH: transit
      """
    When the following request is received:
      """
      PATCH /users/properties/${{ Bob.id }}/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      newbie: false
      """
    Then the following reply is sent:
      """
      204 No Content
      """
    And the following event `users.properties.sync` is received by Bob:
      """yaml
      newbie: false
      """

  Scenario: Streaming a resource of the application
    Given the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          GET:
            realtime:stream: room
      """
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Hello!
      author: Bob
      """
    Then Alice receives exactly:
      """yaml
      - event: chat.messages.sync
        data:
          room: general
          text: Hello!
      """

  Scenario: Streaming what an event of another key does not reach
    Given the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: random
      text: Elsewhere
      """
    Then Alice receives no event `chat.messages.sync`
    And the stream of `random` does not exist

  Scenario: Writing an event once, whoever reads it
    Given the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And Bob is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Hello!
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Hello!
      """
    And Bob receives the event `chat.messages.sync`:
      """yaml
      text: Hello!
      """
    And the stream of `general` holds 1 event

  Scenario: Replaying what was missed on another gateway
    Given the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    And Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    When Alice disconnects
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Missed
      """
    And the Gateway is stopped
    And the Gateway is running
    And Alice reconnects
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Missed
      """

  Scenario: Keeping the streams in several Redis
    Given the realtime streams are kept in:
      """yaml
      - redis://localhost:31040
      - redis://localhost:31041
      """
    And the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    When Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And Bob is consuming:
      """
      GET /chat/messages/rooms/random/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: One
      """
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: random
      text: Two
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: One
      """
    And Bob receives the event `chat.messages.sync`:
      """yaml
      text: Two
      """
    And the stream of `general` is kept in `redis://localhost:31041`
    And the stream of `random` is kept in `redis://localhost:31040`

  @timing
  Scenario: Keeping a stream while it is read
    Given the realtime streams expire in 2 seconds
    And the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    And Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    When after 4 seconds
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Still here
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Still here
      """

  @timing
  Scenario: Letting a stream go once nobody reads it
    Given the realtime streams expire in 2 seconds
    And the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    And Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    When Alice disconnects
    And after 4 seconds
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Nobody
      """
    Then the stream of `general` does not exist

  @timing
  Scenario: Reconnecting after the stream expired
    Given the realtime streams expire in 2 seconds
    And the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    And Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    When Alice disconnects
    And after 4 seconds
    And Alice reconnects
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Late
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Late
      """

  @containers
  Scenario: Delivering after the realtime Redis restarted
    Given the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    And Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    When the realtime Redis is stopped
    And the realtime Redis is started
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Back
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Back
      """

  @containers
  Scenario: Writing what was routed while the realtime Redis was down
    Given the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /:
          anonymous: true
          io:output: false
          POST: post
        /rooms/:room/stream:
          anonymous: true
          GET:
            realtime:stream: room
      """
    And Alice is consuming:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      accept: application/json
      """
    When the realtime Redis is stopped
    And the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: While away
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the realtime Redis is started
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: While away
      """

  Scenario: Refusing a stream the route does not authorize
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 4344518184ad44228baffce7a44fd0b1 | nex       | user     | $2b$10$JoiAQUS7tzobDAFIDBWhWeEIJv933dQetyjRzSmfQGaJE5ZlJbmYy |
    And the `chat.messages` is running with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
        /rooms/:room/stream:
          auth:role: chat:moderator
          GET:
            realtime:stream: room
      """
    When the following request is received:
      """
      GET /chat/messages/rooms/general/stream/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic dXNlcjpwYXNz
      accept: application/json
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
    And the stream of `general` does not exist
