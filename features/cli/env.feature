Feature: Export local deployment environment variables

  Scenario: Show help
    When I run `toa env --help`
    And stdout should contain lines:
      """
      toa env
      Select environment
        -p, --path
      """

  Scenario: Export `some` environment
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      """
    When I run `toa env some`
    Then the environment contains:
      """
      TOA_ENV=some
      TOA_AMQP_CONTEXT=eyIuIjpbImFtcXA6Ly93aGF0ZXZlciJdfQ==
      TOA_AMQP_CONTEXT__USERNAME=
      TOA_AMQP_CONTEXT__PASSWORD=
      """

  Scenario: Keeping secret values while switching environment
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context:
          .: amqp://whatever
          .@some: amqp://some.host
          .@dev: amqp://dev.host
      """
    When I run `toa env some`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=test
      """
    And I run `toa env dev`
    Then the environment contains:
      """
      TOA_ENV=dev
      TOA_AMQP_CONTEXT__USERNAME=test
      """

  Scenario Outline: Setting `local` environment
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa <command>`
    Then the environment contains:
      """
      TOA_ENV=local
      """
    Examples:
      | command   |
      | env       |
      | env local |

  Scenario: Export environment to a custom file name
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa env some --as .env.some`
    Then the file ./.env.some contains exact line 'TOA_ENV=some'
    And the file ./.env.some contains exact line 'TOA_CONTEXT=collection'

  Scenario: Fill secrets with `--dev`
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      """
    When I run `toa env --dev`
    Then the environment contains:
      """
      TOA_AMQP_CONTEXT__USERNAME=developer
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """

  Scenario: Keeping secret values with `--dev`
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      """
    When I run `toa env`
    And I update an environment with:
      """
      TOA_AMQP_CONTEXT__USERNAME=custom
      """
    And I run `toa env --dev`
    Then the environment contains:
      """
      TOA_AMQP_CONTEXT__USERNAME=custom
      TOA_AMQP_CONTEXT__PASSWORD=secret
      """

  Scenario: Generate identity token key with `--dev`
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      configuration:
        configuration.base:
          foo: $IDENTITY_TOKENS_KEY0
      """
    When I run `toa env --dev`
    Then program should exit with code 0
    And the environment variable TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0 starts with 'k3.local.'

  Scenario: Fill secrets from process environment by secret key with `--dev`
    Given I have a component `storage`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      storages:
        tmp:
          provider: tmp
          directory: test
        assets:
          provider: cloudinary
          environment: demo
          type: image
      """
    And environment variables:
      """
      API_KEY=cloud-key
      API_SECRET=cloud-secret
      """
    When I run `toa env --dev`
    Then the environment contains:
      """
      TOA_STORAGES_ASSETS_API_KEY=cloud-key
      TOA_STORAGES_ASSETS_API_SECRET=cloud-secret
      """

  Scenario: Throw when secret key environment variables are missing with `--dev`
    Given I have a component `storage`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      storages:
        tmp:
          provider: tmp
          directory: test
        assets:
          provider: cloudinary
          environment: demo
          type: image
      """
    When I run `toa env --dev`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      toa-storages-assets/API_KEY, toa-storages-assets/API_SECRET is not set
      """

  Scenario: Fill configuration secret from process environment with `--dev`
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      configuration:
        configuration.base:
          foo: $FOO_VALUE
      """
    And environment variables:
      """
      FOO_VALUE=bar
      """
    When I run `toa env --dev`
    Then the environment contains:
      """
      TOA_CONFIGURATION__FOO_VALUE=bar
      """

  Scenario: Throw when secret key is missing from process environment with `--dev`
    Given I have a component `configuration.base`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      configuration:
        configuration.base:
          foo: $FOO_VALUE
      """
    When I run `toa env --dev`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      toa-configuration/FOO_VALUE is not set
      """
