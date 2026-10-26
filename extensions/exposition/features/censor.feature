@security
Feature: Censor

  Scenario: A censored request is refused before it is routed
    Given the annotation:
      """yaml
      country: CF-IPCountry
      censor: [RU, IR]
      /:
        /foo:
          anonymous: true
          GET:
            dev:stub: Hello
        /bar:
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      cf-ipcountry: RU
      """
    Then the following reply is sent:
      """
      451 Unavailable For Legal Reasons
      """
    When the following request is received:
      """
      GET /bar/ HTTP/1.1
      host: nex.toa.io
      cf-ipcountry: IR
      """
    Then the following reply is sent:
      """
      451 Unavailable For Legal Reasons
      """

  Scenario: Any other request is served
    Given the annotation:
      """yaml
      country: cf-ipcountry
      censor: [RU, IR]
      /:
        anonymous: true
        /foo:
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      cf-ipcountry: US
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: A page reads the refusal
    Given the annotation:
      """yaml
      country: cf-ipcountry
      censor: [RU, IR]
      /:
        anonymous: true
        /foo:
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      OPTIONS /foo/ HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      access-control-request-method: GET
      cf-ipcountry: RU
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-origin: *
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      origin: https://hello.world
      cf-ipcountry: RU
      """
    Then the following reply is sent:
      """
      451 Unavailable For Legal Reasons
      access-control-allow-origin: *
      """

  Scenario: Censoring with no country to read
    The countries are read from the header `country` names, and without it no request has one.

    Given the annotation:
      """yaml
      censor: [RU, IR]
      /:
        anonymous: true
        /foo:
          GET:
            dev:stub: Hello
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      host: nex.toa.io
      cf-ipcountry: RU
      """
    Then the following reply is sent:
      """
      200 OK
      """
