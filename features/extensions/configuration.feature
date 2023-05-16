Feature: Configuration Extension

  Scenario: Should provide Aspect
    Given I boot `configuration.base` component
    When I invoke `echo`
    Then the reply is received:
      """yaml
      output:
        foo: hello
      """
    And I disconnect

  Scenario: Should extend prototype's configuration
    Given I boot `configuration.extended` component
    When I invoke `echo`
    Then the reply is received:
      """yaml
      output:
        foo: hello
        bar: 1
      """
    And I disconnect

  Scenario: Configuration environment override
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

  Scenario: Configuration secret values
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
      TOA_CONFIGURATION__FOO_SECRET_VALUE=secret
      """
    And I run `toa invoke echo -p ./components/configuration.base`
    And stdout should contain lines:
    """
    { output: { foo: 'secret' } }
    """
