Feature: Realtime across regions

  An event a converging component routes reaches the streams of its key in every region: what the
  region that committed the change writes to its streams is carried to the others with the record,
  and written to theirs.

  The suite is the region `us`, as it is in the convergence suite: it publishes to that region's
  own broker, and federation carries what it publishes to the composition's region, `eu`, and back.

  Background:
    Given this is the region `eu`, converging with `us`
    And the `chat.messages` convergence queues are empty
    And the `chat.messages` database is empty

  Scenario: Carrying a routed event to the other region
    Given the region `us` is consuming `chat.messages`
    And the `chat.messages` is converging with the following manifest:
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
      """
    When the following request is received:
      """
      POST /chat/messages/ HTTP/1.1
      host: nex.toa.io
      content-type: application/yaml

      room: general
      text: Hello!
      author: Bob
      """
    Then the following reply is sent:
      """
      201 Created
      """
    And the region `us` is sent `chat.messages` carrying:
      """yaml
      realtime:
        - event: chat.messages.sync
          keys: [general]
          data:
            room: general
            text: Hello!
      """

  Scenario: Streaming an event of the other region
    Given the `chat.messages` is converging with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
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
    When the region `us` writes to `chat.messages`:
      """yaml
      record:
        id: 5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a
        room: general
        text: From us
        VERSION: 1
        CREATED: 1757320000000
        UPDATED: 1757320000000
        DELETED: null
        REGION: 1
      carried:
        realtime:
          - event: chat.messages.sync
            keys: [general]
            data:
              room: general
              text: From us
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      room: general
      text: From us
      """
    And the `chat.messages` record `5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a` is of version 1

  Scenario: Streaming an event of the other region whose record is older
    Given the `chat.messages` database contains:
      | _id                              | room    | text    | VERSION | REGION |
      | 5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a | general | Settled | 5       | 0      |
    And the `chat.messages` is converging with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
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
    When the region `us` writes to `chat.messages`:
      """yaml
      record:
        id: 5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a
        room: general
        text: Stale
        VERSION: 2
        CREATED: 1757320000000
        UPDATED: 1757320000000
        DELETED: null
        REGION: 1
      carried:
        realtime:
          - event: chat.messages.sync
            keys: [general]
            data:
              room: general
              text: Stale
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Stale
      """
    And the `chat.messages` record `5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a` is of version 5

  Scenario: Writing nothing to a key nobody reads here
    Given the `chat.messages` is converging with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
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
    When the region `us` writes to `chat.messages`:
      """yaml
      record:
        id: 5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a
        room: general
        text: Both
        VERSION: 1
        CREATED: 1757320000000
        UPDATED: 1757320000000
        DELETED: null
        REGION: 1
      carried:
        realtime:
          - event: chat.messages.sync
            keys: [general, random]
            data:
              room: general
              text: Both
      """
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: Both
      """
    And the stream of `random` does not exist

  @containers
  Scenario: Streaming what the other region carried while the realtime Redis was down
    Given the `chat.messages` is converging with the following manifest:
      """yaml
      realtime:
        sync:
          key: room
          expose: [room, text]
      exposition:
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
    And the region `us` writes to `chat.messages`:
      """yaml
      record:
        id: 5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a
        room: general
        text: While away
        VERSION: 1
        CREATED: 1757320000000
        UPDATED: 1757320000000
        DELETED: null
        REGION: 1
      carried:
        realtime:
          - event: chat.messages.sync
            keys: [general]
            data:
              room: general
              text: While away
      """
    And after 3 seconds
    And the realtime Redis is started
    And after 10 seconds
    Then Alice receives the event `chat.messages.sync`:
      """yaml
      text: While away
      """
    And the `chat.messages` record `5d1e0c5e2a7b4f0c9e3b8a6d4c2f1e0a` is of version 1
