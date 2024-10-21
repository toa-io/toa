Feature: Input properties authorization

  Background:
    Given the `identity.basic` database contains:
      | _id                              | authority | username | password                                                     |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | nex       | root     | $2b$10$Qq/qnyyU5wjrbDXyWok14OnqAZv/z.pLhz.UddatjI6eHU/rFof4i |
    And the `identity.roles` database contains:
      | _id                              | identity                         | role  |
      | 9c4702490ff84f2a9e1b1da2ab64bdd4 | 72cf9b0ab0ac4ab2b8036e4e940ddcae | app:b |

  Scenario: Input properties authorization
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:input: [a, b]
          io:output: [a, b]
          anonymous: true
          auth:role: app:b
          auth:input:
            - prop: b
              role: app:b
          PUT: parameters
      """

    When the following request is received:
      """
      PUT /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      a: foo
      b: bar
      """
    Then the following reply is sent:
      """
      403 Forbidden

      Input property is not authorized
      """
    When the following request is received:
      """
      PUT /echo/ HTTP/1.1
      host: nex.toa.io
      authorization: Basic cm9vdDpzZWNyZXQ=
      accept: application/yaml
      content-type: application/yaml

      a: foo
      b: bar
      """
    Then the following reply is sent:
      """
      200 OK

      a: foo
      b: bar
      """
