Feature: Help

  What a resource and its methods are, in the words an application chooses for them. One
  declaration, read by everything that describes a resource: `OPTIONS`, discovery, and the
  tools MCP publishes.

  Scenario: What a method is
    A bare value is the title, which is the short thing. A sentence is written beside it.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id]
          GET:
            help:method: Every pot
            endpoint: enumerate
          POST:
            help:method:
              title: Put a pot on
              description: Start a new pot brewing.
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
      Allow: GET, POST

      GET:
        title: Every pot
      POST:
        title: Put a pot on
        description: Start a new pot brewing.
      """

  Scenario: What a resource is
    A resource is described beside the methods it serves, and a verb is upper case — so
    neither key can be mistaken for the other.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          help:node: Pots
          io:output: [id]
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

      title: Pots
      GET:
      """

  Scenario: A resource says what a method does, in the same words
    Both take the same value: a bare one is the title, a sentence is written beside it.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          help:node:
            title: Pots
            description: What is brewing, and what is in it.
          io:output: [id]
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

      title: Pots
      description: What is brewing, and what is in it.
      GET:
      """

  Scenario: What a resource is, is not said of what is under it
    Every other directive is inherited. This one is not: a description carried downward
    would say of every resource below that it is the one it was written for.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          help:node: Pots
          io:output: [id]
          GET: enumerate
          /:id:
            GET: observe
      """
    When the following request is received:
      """
      OPTIONS /pots/:id/ HTTP/1.1
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
      Pots
      """

  Scenario: A resource that answers in another's place is described by it
    An intermediate node is never what a path matches — its `/` answers there instead — so
    the two are one resource, and what describes it carries.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          help:node: Pots
          /:
            io:output: [id]
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

      title: Pots
      """

  Scenario: The whole tree carries it
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          help:node: Pots
          io:output: [id]
          GET:
            help:method: Every pot
            endpoint: enumerate
      """
    When the following request is received:
      """
      OPTIONS /.discovery HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      routes:
        /pots:
          title: Pots
          GET:
            title: Every pot
      """

  Scenario: What the parameters are
    A schema says `title` and `description` of what it describes, which is where these go.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:first:
          io:output: true
          PATCH:
            query:
              parameters: [a]
            help:route:
              first: Which one
            help:query:
              a:
                title: The one to greet
                description: A name, or nothing to greet the world.
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
          first:
            title: Which one
        query:
          a:
            type: string
            title: The one to greet
            description: A name, or nothing to greet the world.
      """

  Scenario: A segment a mapping renamed
    `map:segments` answers a variable under the property it fills, so that is the name it
    is described by — the template's is nowhere in the answer.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:first:
          io:output: true
          PATCH:
            map:segments:
              a: first
            help:route:
              a: Which one
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
            title: Which one
      """
    And the reply does not contain:
      """
      first:
      """

  Scenario: A parameter nothing answers
    A name that is nobody's is not answered. The template is not what says them all, so
    there is nothing to check it against where it is written.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:id:
          io:output: [id]
          GET:
            help:route:
              pot: Which pot
            help:query:
              nothing: Nobody
            endpoint: observe
      """
    When the following request is received:
      """
      OPTIONS /pots/:id/ HTTP/1.1
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
      Which pot
      """

  Scenario: What guards a resource
    `auth` says what reaching one takes, so that a reader is not offered what is not theirs
    and can tell the machinery from what the application serves.

    Given the annotation:
      """yaml
      /:
        anonymous: true
        /pots:
          GET:
            auth:anyone: true
            dev:stub: []
        /accounts/:id:
          GET:
            auth:id: id
            dev:stub: []
        /admin:
          GET:
            auth:role: operator
            dev:stub: []
        /introspection:
          GET:
            auth:role: system:introspection
            dev:stub: []
      """
    When the following request is received:
      """
      OPTIONS /.discovery HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      routes:
        /accounts/:id:
          private: true
          GET:
            private: true
        /admin:
          protected: true
          GET:
            protected: true
        /introspection:
          protected: true
          system: true
          GET:
            protected: true
            system: true
        /pots:
          authenticated: true
          GET:
            authenticated: true
      """

  Scenario: A rule says what each of its own says
    `auth:rule` is the directives it composes, and describing one is describing them.

    Given the annotation:
      """yaml
      /:
        anonymous: true
        /papers/:id:
          GET:
            auth:rule:
              id: id
              role: system:archive
            dev:stub: []
      """
    When the following request is received:
      """
      OPTIONS /papers/:id/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      Allow: GET

      private: true
      protected: true
      system: true
      GET:
        private: true
        protected: true
        system: true
      """

  Scenario: A tool is called what the method is called
    `mcp:tool` says only whether the method is published; what it is, is `help:method`.

    Given the annotation:
      """yaml
      mcp:
        name: Pots
        anonymous: true
      /:
        anonymous: true
        /pots:
          GET:
            mcp:tool: true
            help:method:
              title: Hot pots
              description: The pots that are too hot to pour.
            dev:stub: []
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      content-type: application/json
      accept: application/yaml
      mcp-protocol-version: 2026-07-28
      mcp-method: tools/list

      {"jsonrpc": "2.0", "id": 1, "method": "tools/list",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      - name: pots.GET
        title: Hot pots
        description: The pots that are too hot to pour.
      """
    # and the resource says of itself that it publishes one
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

      GET:
        title: Hot pots
        description: The pots that are too hot to pour.
        mcp: true
      """

  Scenario: A resource that serves nothing cannot be described
    Nothing would carry what it says, so the declaration is refused where it is written
    rather than found missing from the answer.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id]
          GET: enumerate
          /brewing:
            help:node: Brewing
            /:id:
              GET: observe
      """
    # a route only this declaration serves: a refused branch leaves the one before it
    When the following request is received:
      """
      OPTIONS /pots/brewing/:id/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: A method nobody is meant to find
    `help:method: null` takes the method out of every answer and leaves it as callable as it
    was — what a monitor reaches for, and what a person has no business going looking for.

    Given the annotation:
      """yaml
      /:
        anonymous: true
        /hello:
          GET:
            dev:stub: hi
          /agent:
            GET:
              help:method: null
              dev:stub: hi
      """
    When the following request is received:
      """
      OPTIONS /.discovery HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      routes:
        /hello:
          GET:
            anonymous: true
      """
    And the reply does not contain:
      """
      /hello/agent
      """
    # and it answers as it always did
    When the following request is received:
      """
      GET /hello/agent/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      """
