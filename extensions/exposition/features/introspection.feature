Feature: Introspection

  Scenario: Resource introspection
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET: enumerate
          POST: create
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: GET, POST

      GET:
        output:
          type: array
          items:
            properties:
              id:
                type: string
                pattern: ^[a-fA-F0-9]{32}$
              title:
                type: string
                maxLength: 64
              volume:
                type: number
                exclusiveMinimum: 0
                maximum: 1000
              temperature:
                type: number
                exclusiveMinimum: 0
                maximum: 300
            type: object
            required:
              - id
              - title
              - volume
      POST:
        input:
          properties:
            temperature:
              type: number
              exclusiveMinimum: 0
              maximum: 300
            title:
              type: string
              maxLength: 64
            volume:
              type: number
              exclusiveMinimum: 0
              maximum: 1000
          type: object
          required:
            - title
            - volume
        output: {}
        errors:
          - NO_WAY
          - WONT_CREATE
      """

  Scenario: What a method states it is
    An operation states what it is for the Introspection to read, and that is not what a
    resource is: an operation is written without knowledge of any route, and the same one
    mounted twice is two methods. What a method states is what its route states.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            mcp:tool: Every pot there is, newest first.
            endpoint: enumerate
          POST: create
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: GET, POST

      GET:
        description: Every pot there is, newest first.
      """
    And the reply does not contain:
      """
      Put a pot on to brew.
      """

  Scenario: What the directives of the route admit
    A schema states what may be sent and what comes back, which is what the route's
    directives leave of what the operation declared — not what the operation declared.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:input: [title]
          io:output: [id, title]
          GET: enumerate
          POST: create
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: GET, POST

      GET:
        output:
          type: array
          items:
            properties:
              id:
                type: string
                pattern: ^[a-fA-F0-9]{32}$
              title:
                type: string
                maxLength: 64
            type: object
            required:
              - id
              - title
      POST:
        input:
          properties:
            title:
              type: string
              maxLength: 64
          type: object
          required:
            - title
      """
    And the reply does not contain:
      """
      volume
      """

  Scenario: A method whose reply is dropped describes none
    Without an `io:output` nothing of the reply is sent, so there is no output to state.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET: enumerate
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: GET
      """
    And the reply does not contain:
      """
      output
      """

  Scenario: A method the caller cannot reach is not described
    What a resource says about itself is what this caller may use of it, so a method they
    could only be refused is not in the answer, nor in `Allow`.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          isolated: true
          io:output: true
          GET:
            anonymous: true
            endpoint: enumerate
          POST:
            auth:role: admin
            endpoint: create
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: GET
      """
    And the reply does not contain:
      """
      POST:
      """

  Scenario: A resource the caller cannot reach at all
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          isolated: true
          io:output: true
          GET:
            auth:role: admin
            endpoint: enumerate
      """
    When the following request is received:
      """
      OPTIONS /pots/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """

  Scenario: Introspection with route parameters
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:a:
          io:output: true
          PATCH: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/:a/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: PATCH

      PATCH:
        route:
          a:
            type: string
        input:
          type: object
          properties:
            b:
              type: string
        output:
          type: object
          properties:
            a:
              type: string
            b:
              type: string
      """

  Scenario: A property a header carries
    `map:headers` fills the property from the request, so it is not the body's to send —
    and the caller is told where it does go.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          PATCH:
            map:headers:
              a: x-first
            endpoint: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: PATCH

      PATCH:
        headers:
          a:
            type: string
            header: x-first
        input:
          type: object
          properties:
            b:
              type: string
      """

  Scenario: A property a segment carries under another name
    `map:segments` names the property differently from the segment it reads, so the route
    states the property — which is what a caller writes.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:first:
          io:output: true
          PATCH:
            map:segments:
              a: ~first
            endpoint: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/:first/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: PATCH

      PATCH:
        route:
          a:
            type: string
        input:
          type: object
          properties:
            b:
              type: string
      """

  Scenario: A property the token carries
    `map:claims` reads the identity, and a caller has nowhere to put one.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          anonymous: true
          PATCH:
            map:claims:
              a: email
            endpoint: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: PATCH

      PATCH:
        input:
          type: object
          properties:
            b:
              type: string
      """
    And the reply does not contain:
      """
      headers
      """

  Scenario: Two routes on one endpoint
    A route takes its variables out of the operation's input to state them as its own. The
    input it takes them out of is the operation's, shared by every route that mounts it, so
    the one that describes itself second must still find them there.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          /:a:
            PATCH: parameters
          /plain:
            PATCH: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/:a/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      PATCH:
        route:
          a:
            type: string
        input:
          type: object
          properties:
            b:
              type: string
      """
    When the following request is received:
      """
      OPTIONS /echo/plain/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      PATCH:
        input:
          type: object
          properties:
            a:
              type: string
            b:
              type: string
      """

  Scenario: Introspection with query parameters
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          PATCH:
            query:
              parameters: [a]
            endpoint: parameters
      """
    When the following request is received:
      """
      OPTIONS /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: PATCH

      PATCH:
        query:
          a:
            type: string
        input:
          type: object
          properties:
            b:
              type: string
        output:
          type: object
          properties:
            a:
              type: string
            b:
              type: string
      """
