Feature: Configuration Extension

  A component's configuration is held by the `configuration.values` component, which the
  extension runs as a service. What every component's epoch, schema and defaults are, the
  service is told on deployment. A component asks for its configuration when it starts,
  and follows what is created afterwards.

  Scenario: Using Aspect
    Given the configuration of `configuration.base` is deployed
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    When I boot `configuration.base` component
    And I invoke `echo`
    Then the reply is received:
      """yaml
      foo: hello
      """
    And I disconnect

  Scenario Outline: Array of objects
    Given the configuration of `configuration.array` is deployed
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    When I boot `configuration.array` component
    And I invoke `greet` with:
      """yaml
      input: <index>
      """
    Then the reply is received:
      """yaml
      <output>
      """
    And I disconnect
    Examples:
      | index | output         |
      | 0     | good day       |
      | 1     | good afternoon |

  Scenario: Extending prototype's configuration
    Given the configuration of `configuration.extended` is deployed
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    When I boot `configuration.extended` component
    And I invoke `echo`
    Then the reply is received:
      """yaml
      foo: hello
      bar: world
      baz: something
      qux: 1
      """
    And I disconnect

  Scenario: Deployed values
    Given the configuration of `configuration.base` is deployed with:
      """yaml
      foo: deployed
      """
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    When I boot `configuration.base` component
    And I invoke `echo`
    Then the reply is received:
      """yaml
      foo: deployed
      bar: world
      """
    And I disconnect

  Scenario: Creating configuration
    Given the configuration of `configuration.base` is deployed
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    And I boot `configuration.base` component
    When I call `configuration.values.create` with:
      """yaml
      input:
        component: configuration.base
        configuration:
          foo: created
        originator:
          id: tester
      """
    Then the reply is received:
      """yaml
      component: configuration.base
      originator: tester
      configuration:
        foo: created
        bar: world
        num: 0
      """
    # the running component follows the service
    When I wait 1 second
    And I invoke `echo`
    Then the reply is received:
      """yaml
      foo: created
      """
    And I disconnect
    # and one that starts later gets what was created
    When I boot `configuration.base` component
    And I invoke `echo`
    Then the reply is received:
      """yaml
      foo: created
      """
    And I disconnect

  Scenario: Creating configuration for an unknown component
    Given the configuration of `configuration.base` is deployed
    And the `configuration` service is staged
    When I call `configuration.values.create` with:
      """yaml
      input:
        component: configuration.nope
        configuration: {}
        originator:
          id: tester
      """
    Then the error is received:
      """yaml
      code: UNKNOWN_COMPONENT
      """

  Scenario: Creating configuration not fitting the schema
    Given the configuration of `configuration.base` is deployed
    And the `configuration` service is staged
    When I call `configuration.values.create` with:
      """yaml
      input:
        component: configuration.base
        configuration:
          foo:
            nested: true
        originator:
          id: tester
      """
    Then the error is received:
      """yaml
      code: INVALID_CONFIGURATION
      """

  Scenario: Reading configuration
    Given the configuration of `configuration.base` is deployed with:
      """yaml
      foo: deployed
      """
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    When I call `configuration.values.get` with:
      """yaml
      input:
        component: configuration.base
      """
    Then the reply is received:
      """yaml
      configuration:
        foo: deployed
      schema:
        type: object
      """
    When I call `configuration.values.get` with:
      """yaml
      input:
        component: configuration.nope
      """
    Then the reply is received:
      """yaml
      null
      """

  Scenario: Secrets are objects, and stay redacted
    Given an environment variable `TOA_CONFIGURATION__SECRET_B` is set to 'hidden'
    And the configuration of `configuration.secrets` is deployed with:
      """yaml
      a: 1
      b: $SECRET_B
      """
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    # composed, not booted: a call through the broker finds a component a composition exposes
    And I compose `configuration.secrets` component
    When I call `configuration.secrets.echo`
    Then the reply is received:
      """yaml
      a: 1
      b: <REDACTED>
      """
    When I call `configuration.secrets.reveal`
    Then the reply is received:
      """yaml
      hidden
      """

  Scenario: Listing configurations
    Given the configuration of `configuration.base` is deployed with:
      """yaml
      foo: deployed
      """
    And the configuration of `configuration.array` is deployed
    And the `configuration` service is staged
    And the `configuration.values` database is empty
    When I call `configuration.values.list`
    Then the reply is received:
      """yaml
      - component: configuration.array
        configuration: {}
      - component: configuration.base
        configuration:
          foo: deployed
      """

  Scenario: Local override
    Given an environment variable `TOA_CONFIGURATION_CONFIGURATION_BASE` is set to:
      """yaml
      foo: local
      """
    When I boot `configuration.base` component
    And I invoke `echo`
    Then the reply is received:
      """yaml
      foo: local
      """
    And I disconnect

  Scenario: The values service states what it may take
    The annotation is a map of components, so the one option the service has of its own
    is reserved: `resources` is the service's, not a component of that name.

    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        resources:
          cpu: [200m, 1000m]
          memory: [200Mi, 500Mi]
        configuration.base:
          foo: ok
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: configuration-values
          resources:
            cpu:
              - 200m
              - 1000m
            memory:
              - 200Mi
              - 500Mi
      """

  Scenario: Deployment
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          foo: ok
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: configuration-values
          components:
            - configuration-values
          variables:
            - name: TOA_CONFIGURATION_VALUES
      """
    And exported values should not contain:
      """yaml
      compositions:
        - name: configuration-base
          variables:
            - name: TOA_CONFIGURATION_CONFIGURATION_BASE
      """

  Scenario: Secret values deployment
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          foo: $FOO_VALUE
          bar: $BAR_VALUE
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: configuration-base
          variables:
            - name: TOA_CONFIGURATION__FOO_VALUE
              secret:
                name: toa-configuration
                key: FOO_VALUE
            - name: TOA_CONFIGURATION__BAR_VALUE
              secret:
                name: toa-configuration
                key: BAR_VALUE
      """

  Scenario: Deployment of secret values within an array
    Given I have a component `configuration.array`
    And I have a context with:
      """yaml
      configuration:
        configuration.array:
          greetings:
            - a: $A
              b: $B
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: configuration-array
          variables:
            - name: TOA_CONFIGURATION__A
              secret:
                name: toa-configuration
                key: A
            - name: TOA_CONFIGURATION__B
              secret:
                name: toa-configuration
                key: B
      """

  Scenario: Shared secret deployment
    Given I have components:
      | configuration.base     |
      | configuration.extended |
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          foo: $FOO_VALUE
        configuration.extended:
          baz: $FOO_VALUE
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: configuration-base
          variables:
            - name: TOA_CONFIGURATION__FOO_VALUE
              secret:
                name: toa-configuration
                key: FOO_VALUE
        - name: configuration-extended
          variables:
            - name: TOA_CONFIGURATION__FOO_VALUE
              secret:
                name: toa-configuration
                key: FOO_VALUE
      """

  Scenario: Local environment secrets
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          foo: $FOO_VALUE
      """
    When I run `toa env`
    Then the environment contains:
      """
      TOA_CONFIGURATION__FOO_VALUE=
      """

  Scenario: Configuration for non-existent component
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        foo.bar:
          foo: 1
      """
    When I run `toa env`
    Then program should exit with code 1
    And stderr should contain line:
    """
    Component 'foo.bar' does not request configuration or does not exist.
    """
