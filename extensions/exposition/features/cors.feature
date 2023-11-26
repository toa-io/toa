Feature: CORS Support

  Background:
    Given the `identity.basic` database contains:
      | _id                              | username  | password                                                     |
      | efe3a65ebbee47ed95a73edd911ea328 | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |

  Scenario: Using CORS
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          dev:stub: Hello
        /private/:id:
          auth:id: id
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      OPTIONS / HTTP/1.1
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-origin: https://hello.world
      access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
      access-control-allow-headers: accept,authorization,content-type
      access-control-allow-credentials: true
      access-control-max-age: 86400
      vary: origin
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      200 OK
      access-control-allow-origin: https://hello.world
      access-control-allow-credentials: true
      vary: origin
      """
    When the following request is received:
      """
      GET /private/efe3a65ebbee47ed95a73edd911ea328/ HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      origin: https://hello.world
      """
    Then the following reply is sent:
      """
      200 OK
      access-control-allow-origin: https://hello.world
      access-control-allow-credentials: true
      vary: origin
      """
