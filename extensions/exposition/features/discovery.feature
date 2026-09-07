Feature: Resource discovery

  Every route an application serves, at one path, described as `OPTIONS` on each of them
  describes it.

  Scenario: What an application serves
    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, title]
          GET: enumerate
          POST: create
          /:id:
            GET: observe
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
      Allow: GET, HEAD, OPTIONS
      cache-control: private, max-age=1800

      routes:
        /pots:
          GET:
            output:
              type: array
              items:
                properties:
                  id:
                    type: string
                  title:
                    type: string
          POST:
            input:
              properties:
                title:
                  type: string
        /pots/:id:
          GET:
            output:
              properties:
                id:
                  type: string
      """

  Scenario: A key is a request that can be made
    What each entry says is what `OPTIONS` on that key says, so a client reads the tree
    once and addresses any of it by the key it was given.

    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:a:
          io:output: true
          PATCH: parameters
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
        /echo/:a:
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
      """

  Scenario: A resource this caller may reach no method of is not there
    `OPTIONS` on one answers `403`, and a tree cannot refuse a single entry — so it is
    omitted, rather than named as something that exists and is not for them.

    Given the annotation:
      """yaml
      /:
        /open:
          anonymous: true
          GET:
            dev:stub: hello
        /closed:
          auth:role: admin
          GET:
            dev:stub: secret
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
        /open:
          GET:
            anonymous: true
      """
    And the reply does not contain:
      """
      /closed:
      """

  Scenario: Only the verbs this caller may reach
    A resource is described by what is left of it, not dropped for the part that is not
    theirs.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          isolated: true
          io:output: [id, title]
          GET:
            anonymous: true
            endpoint: enumerate
          POST:
            auth:role: admin
            endpoint: create
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
          GET:
      """
    And the reply does not contain:
      """
      temperature
      """

  Scenario: A credential does not hide what is anonymous
    A credential refuses an `anonymous` route because it would make the reply uncacheable,
    and a description is not that reply. Without this an identity would be shown less of
    the tree than someone presenting nothing at all.

    Given the `identity.basic` database contains:
      # developer:secret
      | _id                              | authority | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | nex       | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    And the `identity.bans` database is empty
    And the annotation:
      """yaml
      /:
        /pots:
          anonymous: true
          GET:
            dev:stub: hello
      """
    When the following request is received:
      """
      OPTIONS /.discovery HTTP/1.1
      host: nex.toa.io
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      routes:
        /pots:
          GET:
            anonymous: true
      """

  Scenario: What picks the records
    `selection` is what a queryable method takes besides the parameters it declares.

    Given the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: [id, title]
          GET: enumerate
          /:id:
            GET: observe
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
          GET:
            selection:
              criteria:
                type: string
              sort:
                type: string
              limit:
                type: integer
              omit:
                type: integer
        /pots/:id:
          GET:
            selection:
              criteria:
                type: string
              sort:
                type: string
      """
