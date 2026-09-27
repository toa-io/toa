Feature: A stream route ends with a token

  Background:
    Given the `todos` database contains:
      | _id                              | owner | title | VERSION | DELETED |
      | 10000000000000000000000000000001 | alice | milk  | 1       | null    |
      | 10000000000000000000000000000002 | alice | bread | 1       | null    |
      | 10000000000000000000000000000003 | alice | eggs  | 1       | null    |
      | 20000000000000000000000000000001 | bob   | tea   | 1       | null    |
    And the `todos` is running with the following manifest:
      """yaml
      exposition:
        /:
          anonymous: true
          GET:
            endpoint: stream
            io:output: [id, title, VERSION]
            query:
              criteria: owner==alice
              limit: { value: 2, range: [1, 100] }
      """

  Scenario: Reading a set a page at a time, then what changed
    When the following request is received:
      """
      GET /todos/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: multipart/yaml; boundary=cut

      --cut
      ACK
      --cut
      entry:
        id: '10000000000000000000000000000001'
        title: milk
        VERSION: 1
      --cut
      entry:
        id: '10000000000000000000000000000002'
        title: bread
        VERSION: 1
      --cut
      token: ${{ first }}
      --cut
      FIN
      --cut--
      """
    And the reply does not contain:
      """
      owner:
      """
    When the following request is received:
      """
      GET /todos/?token=${{ first }} HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      --cut
      ACK
      --cut
      entry:
        id: '10000000000000000000000000000003'
        title: eggs
      --cut
      token: ${{ second }}
      --cut
      FIN
      """
    When the following request is received:
      """
      GET /todos/?token=${{ second }} HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK

      --cut
      ACK
      --cut
      token: ${{ third }}
      --cut
      FIN
      """
    And the reply does not contain:
      """
      entry:
      """

  Scenario: A token the storage cannot continue from
    When the following request is received:
      """
      GET /todos/?token=eyJ2IjoxfQ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      410 Gone
      """

  Scenario: Sorting a stream that pages
    When the following request is received:
      """
      GET /todos/?sort=title:desc HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """

  Scenario: Omitting a page of a stream
    When the following request is received:
      """
      GET /todos/?omit=2 HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """
