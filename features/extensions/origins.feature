Feature: Origins extension

  Scenario: HTTP Aspect
    Given I have a component `origins.http`
    And I have a context with:
      """
      origins:
        origins.http:
          bad: http://localhost:8888/
      """
    When I run `toa env`
    And I update an environment with:
    """
    TOA_AMQP_CONTEXT__USERNAME=developer
    TOA_AMQP_CONTEXT__PASSWORD=secret
    """
    And I run `TOA_DEV=0 toa invoke test -p ./components/origins.http`
    And stdout should contain lines:
      """
      method: 'GET'
      protocol: 'http'
      originalUrl: '/some/path'
      """

  Scenario: HTTP Aspect with overridden value
    Given I have a component `origins.http`
    And I have a context with:
      """
      origins:
        origins.http:
          bad: http://localhost:8888/
          default: http://localhost:8888/
      """
    When I run `toa env`
    And I update an environment with:
    """
    TOA_AMQP_CONTEXT__USERNAME=developer
    TOA_AMQP_CONTEXT__PASSWORD=secret
    """
    And I run `TOA_DEV=0 toa invoke def -p ./components/origins.http`
    And stdout should contain lines:
      """
      method: 'GET'
      protocol: 'http'
      originalUrl: '/path'
      """

  Scenario: HTTP Aspect absolute URL properties environment
    Given I have a component `origins.httpAbsolute`
    And I have a context with:
      """
      origins:
        origins.httpAbsolute:
          .http:
            /^http:\/\/localhost:8888/: true
      """
    When I run `toa env`
    Then the environment contains:
      """
      TOA_ORIGINS_ORIGINS_HTTPABSOLUTE__PROPERTIES=3gABpS5odHRw3gABui9eaHR0cDpcL1wvbG9jYWxob3N0Ojg4ODgvww==
      """

  Scenario: HTTP Aspect absolute URL
    Given I have a component `origins.httpAbsolute`
    And I have a context with:
      """
      origins:
        origins.httpAbsolute:
          .http:
            /^http:\/\/localhost:8888/: true
      """
    When I run `toa env`
    And I run `toa invoke get "{ input: { url: 'http://localhost:8888/path/to/resource' } }" -p ./components/origins.httpAbsolute`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      method: 'GET'
      originalUrl: '/path/to/resource'
      """

  Scenario: Local environment with annotations
    Given I have a component `origins.http`
    And I have a context with:
      """
      origins:
        origins.http:
          bad: http://localhost:8888/
      """
    When I run `toa env`
    And I run `TOA_DEV=1 toa invoke bad -p ./components/origins.http`
    Then program should exit with code 0

  Scenario: HTTP permissions annotation
    Given I have a component `origins.httpAbsolute`
    And I have a context
    When I run `toa env`
    And I run `toa invoke get "{ input: { url: 'http://localhost:8888/path' } }" -p ./components/origins.httpAbsolute`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      <...>URL 'http://localhost:8888/path' is not allowed
      """

  Scenario: Deployment annotations
    Given I have a component `origins.http`
    And I have a context with:
      """yaml
      origins:
        origins.http:
          .http:
            /https:\/\/\w+.amazon.com/: true
          bad: http://localhost:8888/
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: origins-http
          variables:
            - name: TOA_ORIGINS_ORIGINS_HTTP_BAD
              value: http://localhost:8888/
            - name: TOA_ORIGINS_ORIGINS_HTTP__PROPERTIES
              value: 3gABpS5odHRw3gABui9odHRwczpcL1wvXHcrLmFtYXpvbi5jb20vww==
      """

  Scenario: Origin with environment variable placeholder
    Given I have a component `origins.httpEcho`
    And environment variables:
      """
      ECHO_PORT=8888
      ECHO_SUFFIX=host
      ECHO_HOST=localhost
      ECHO_ORIGIN=localhost:8888
      ECHO_NUMBER=8
      """
    And I have a context with:
      """yaml
      origins:
        origins.httpEcho:
          port: http://localhost:${{ ECHO_PORT }}/some/
          suffixed: http://local${{ ECHO_SUFFIX }}:8888/some/
          origin: http://${{ ECHO_ORIGIN }}
          domain: http://${{ ECHO_HOST }}:8888/
          subdomain: http://localhost:${{ ECHO_NUMBER }}888/
      """
    When I run `toa env`
    Then I run `toa invoke port -p ./components/origins.httpEcho`
    And program should exit with code 0
    Then I run `toa invoke suffixed -p ./components/origins.httpEcho`
    And program should exit with code 0

  Scenario: HTTP permission with environment variable placeholder as port
    Given I have a component `origins.httpAbsolute`
    And environment variables:
      """
      ECHO_PORT=8888
      """
    And I have a context with:
      """
      origins:
        origins.httpAbsolute:
          .http:
            /^http:\/\/localhost:${{ ECHO_PORT }}/: true
      """
    And I run `toa env`
    When I run `toa invoke get "{ input: { url: 'http://localhost:8888/path' } }" -p ./components/origins.httpAbsolute`
    Then program should exit with code 0

  Scenario: AMQP credentials deployment annotations
    Given I have a component `origins.amqp`
    And I have a context with:
      """yaml
      origins:
        origins.amqp:
          queue: amqp://localhost
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: origins-amqp
          variables:
            - name: TOA_ORIGINS_ORIGINS_AMQP_QUEUE_USERNAME
              secret:
                name: toa-origins-origins-amqp-queue
                key: username
            - name: TOA_ORIGINS_ORIGINS_AMQP_QUEUE_PASSWORD
              secret:
                name: toa-origins-origins-amqp-queue
                key: password
      """

  Scenario: AMQP credentials
    Given I have a component `origins.amqp`
    And I have a context with:
      """yaml
      origins:
        origins.amqp:
          queue: amqp://localhost
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_ORIGINS_ORIGINS_AMQP_QUEUE_USERNAME=developer
      TOA_ORIGINS_ORIGINS_AMQP_QUEUE_PASSWORD=secret
      """
    And I run `TOA_DEV=1 toa invoke test -p ./components/origins.amqp`
    Then program should exit with code 0

  Scenario: AMQP misconfiguration
    Given I have a component `origins.amqp`
    And I have a context with:
      """yaml
      origins:
        origins.amqp:
          queue: amqp://localhost:5555
      """
    When I run `toa env`
    And I run `toa invoke test -p ./components/origins.amqp`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      <...>ECONNREFUSED
      """

  Scenario: Credentials in the context
    Given I have a component `origins.amqp`
    And I have a context with:
      """yaml
      origins:
        origins.amqp:
          queue: amqp://developer:secret@localhost
      """
    When I run `toa env`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      <...>must not contain credentials.
      """
