Feature: Configuration Extension

  Scenario: Using Aspect
    Given I boot `configuration.base` component
    When I invoke `echo`
    Then the reply is received:
      """yaml
      output:
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
      output: <output>
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
      output:
        foo: hello
        bar: 1
      """
    And I disconnect

  Scenario: Environment override
    Given I have a component `configuration.base`
    And I have a context with:
      """
      configuration:
        configuration.base:
          foo: bye
      """
    When I run `toa env`
    And I run `toa invoke echo -p ./components/configuration.base`
    And stdout should contain lines:
    """
    { output: { foo: 'bye' } }
    """

  Scenario: Secret values
    Given I have a component `configuration.base`
    And I have a context with:
      """
      configuration:
        configuration.base:
          foo: $FOO_SECRET_VALUE
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_CONFIGURATION__FOO_SECRET_VALUE=c3VwZXIgc2VjcmV0IHBhc3N3b3Jk
      """
    And I run `toa invoke echo -p ./components/configuration.base`
    And stdout should contain lines:
    """
    { output: { foo: 'super secret password' } }
    """

  Scenario: Deployment
    Given I have a component `configuration.base`
    And I have a context with:
      """
      configuration:
        configuration.base:
          foo: ok
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        configuration-base:
          - name: TOA_CONFIGURATION_CONFIGURATION_BASE
            value: eyJmb28iOiJvayJ9
      """

  Scenario: Secret values deployment
    Given I have a component `configuration.base`
    And I have a context with:
      """
      configuration:
        configuration.base:
          foo: $FOO_VALUE
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        configuration-base:
          - name: TOA_CONFIGURATION_CONFIGURATION_BASE
            value: eyJmb28iOiIkRk9PX1ZBTFVFIn0=
          - name: TOA_CONFIGURATION__FOO_VALUE
            secret:
              name: toa-configuration
              key: FOO_VALUE
      """

  Scenario: Shared secret deployment
    Given I have components:
      | configuration.base     |
      | configuration.extended |
    And I have a context with:
      """
      configuration:
        configuration.base:
          foo: $FOO_VALUE
        configuration.extended:
          baz: $FOO_VALUE
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        configuration-base:
          - name: TOA_CONFIGURATION__FOO_VALUE
            secret:
              name: toa-configuration
              key: FOO_VALUE
        configuration-extended:
          - name: TOA_CONFIGURATION__FOO_VALUE
            secret:
              name: toa-configuration
              key: FOO_VALUE
      """

  Scenario: Local environment secrets
    Given I have a component `configuration.base`
    And I have a context with:
      """
      configuration:
        configuration.base:
          foo: $FOO_VALUE
      """
    When I run `toa env`
    Then the environment contains:
    """
    TOA_CONFIGURATION__FOO_VALUE=
    """
