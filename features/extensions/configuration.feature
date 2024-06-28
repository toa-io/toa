Feature: Configuration Extension

  Scenario: Using Aspect
    Given I boot `configuration.base` component
    When I invoke `echo`
    Then the reply is received:
      """yaml
      foo: hello
      """
    And I disconnect

  Scenario Outline: Array of objects
    Given I boot `configuration.array` component
    When I invoke `greet` with:
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
    Given I boot `configuration.extended` component
    When I invoke `echo`
    Then the reply is received:
      """yaml
      foo: hello
      bar: world
      baz: something
      qux: 1
      """
    And I disconnect

  Scenario: Environment override
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          foo: bye
          bar: bye
      """
    When I run `toa env`
    And I run `toa invoke echo -p ./components/configuration.base`
    And stdout should contain lines:
    """
    { foo: 'bye', bar: 'bye' }
    """

  Scenario: Secret values
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          foo: $FOO_SECRET_VALUE
          bar: $BAR_SECRET_VALUE
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_CONFIGURATION__FOO_SECRET_VALUE=secret foo
      TOA_CONFIGURATION__BAR_SECRET_VALUE=secret bar
      """
    And I run `toa invoke echo -p ./components/configuration.base`
    And stdout should contain lines:
    """
    { foo: 'secret foo', bar: 'secret bar' }
    """

  Scenario: Secret values within the array
    Given I have a component `configuration.array`
    And I have a context with:
      """yaml
      configuration:
        configuration.array:
          greetings:
            - a: $A_SECRET_VALUE
              b: $B_SECRET_VALUE
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_CONFIGURATION__A_SECRET_VALUE=secret-a
      TOA_CONFIGURATION__B_SECRET_VALUE=secret-b
      """
    And I run `toa invoke greet "{ input: 0 }" -p ./components/configuration.array`
    And stdout should contain lines:
    """
    secret-a secret-b
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
      compositions:
        - name: configuration-base
          variables:
            - name: TOA_CONFIGURATION_CONFIGURATION_BASE
              value: eyJmb28iOiJvayJ9
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
            - name: TOA_CONFIGURATION_CONFIGURATION_BASE
              value: eyJmb28iOiIkRk9PX1ZBTFVFIiwiYmFyIjoiJEJBUl9WQUxVRSJ9
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
            - name: TOA_CONFIGURATION_CONFIGURATION_ARRAY
              value: eyJncmVldGluZ3MiOlt7ImEiOiIkQSIsImIiOiIkQiJ9XX0=
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

  Scenario: Type coercion
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          num: $NUM_SECRET
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_CONFIGURATION__NUM_SECRET=3
      """
    And I run `toa invoke echo -p ./components/configuration.base`
    And stdout should contain lines:
    """
    { foo: 'hello', bar: 'world', num: 3 }
    """
