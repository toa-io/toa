@cli
Feature: Export local deployment environment variables

  Scenario: Show help
    When I run `toa env --help`
    And stdout should contain lines:
      """
      toa env
      Select environment
        -p, --path
        -c, --component
        -s, --service
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
      TOA_AMQP_CONTEXT={".":["amqp://whatever"]}
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

  Scenario: Export environment for a listed component
    Given I have components:
      | mongo.one |
      | stash      |
    And I have a context with:
      """yaml
      compositions:
        - name: data
          components:
            - mongo.one
            - default.stash
      """
    When I run `toa env --component mongo.one`
    Then the environment contains:
      """
      TOA_ENV=local
      TOA_MONGODB_MONGO_ONE=mongodb://localhost:31020
      """
    And the environment does not contain:
      """
      TOA_STASH_DEFAULT_STASH=redis://localhost:31040
      """

  Scenario: Export environment for several listed components
    Given I have components:
      | mongo.one |
      | stash      |
    And I have a context
    When I run `toa env -c mongo.one --component stash`
    Then the environment contains:
      """
      TOA_MONGODB_MONGO_ONE=mongodb://localhost:31020
      TOA_STASH_DEFAULT_STASH=redis://localhost:31040
      """

  Scenario: Throw when a listed component is not in the context
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa env --component missing.one`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Component 'missing.one' is not in the context
      """

  Scenario: Export environment for an evicted component

    Eviction is that Toa does not deploy it. A local run of it still needs its variables,
    so `toa env -c` writes them.

    Given I have components:
      | mongo.one |
      | stash      |
    And I have a context with:
      """yaml
      evicted:
        components:
          - mongo.one
      """
    When I run `toa env --component mongo.one`
    Then the environment contains:
      """
      TOA_ENV=local
      TOA_MONGODB_MONGO_ONE=mongodb://localhost:31020
      """
    And the environment does not contain:
      """
      TOA_STASH_DEFAULT_STASH=redis://localhost:31040
      """

  Scenario: Export environment for an evicted component with a configuration secret
    Given I have components:
      | configuration.base    |
      | configuration.secrets |
    And I have a context with:
      """yaml
      configuration:
        configuration.secrets:
          b: $SECRET_B
      evicted:
        components:
          - configuration.secrets
      """
    When I run `toa env --component configuration.secrets`
    Then program should exit with code 0
    And the environment contains:
      """
      TOA_CONFIGURATION__SECRET_B=
      """

  Scenario: Export environment for a context that configures an evicted component

    Its configuration is served like any other, so the values service knows it, while its secret
    is written only for a run of it.

    Given I have components:
      | configuration.base    |
      | configuration.secrets |
    And I have a context with:
      """yaml
      configuration:
        configuration.secrets:
          b: $SECRET_B
      evicted:
        components:
          - configuration.secrets
      """
    When I run `toa env`
    Then program should exit with code 0
    And the environment does not contain:
      """
      TOA_CONFIGURATION__SECRET_B=
      """
    And the environment variable TOA_CONFIGURATION_VALUES contains '"configuration.secrets"'

  Scenario: Export environment for a listed service
    Given I have components:
      | exposed.one |
      | mongo.one    |
    And I have a context with:
      """yaml
      configuration:
        identity.tokens:
          keys:
            - id: key0
              key: $IDENTITY_TOKENS_ENCRYPTION_KEY0
      """
    When I run `toa env --service exposition`
    Then the environment contains:
      """
      TOA_ENV=local
      TOA_EXPOSITION_PROPERTIES={"authorities":{"local":"localhost"}}
      TOA_MONGODB_IDENTITY_TOKENS=mongodb://localhost:31020
      """
    And the environment does not contain:
      """
      TOA_MONGODB_MONGO_ONE=mongodb://localhost:31020
      TOA_CONFIGURATION_VALUES
      """

  Scenario: Export environment for a component and a service
    Given I have components:
      | exposed.one |
      | mongo.one    |
    And I have a context with:
      """yaml
      configuration:
        identity.tokens:
          keys:
            - id: key0
              key: $IDENTITY_TOKENS_ENCRYPTION_KEY0
      """
    When I run `toa env -c mongo.one -s exposition`
    Then the environment contains:
      """
      TOA_MONGODB_MONGO_ONE=mongodb://localhost:31020
      TOA_EXPOSITION_PROPERTIES={"authorities":{"local":"localhost"}}
      """

  Scenario: Throw when a listed service is not in the context
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa env --service nope`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Service 'nope' is not in the context
      """

  Scenario: A named environment uses its overlay
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context:
          .: amqp://whatever
          .@foo: amqp://foo.host
          .@bar: amqp://bar.host
      """
    When I run `toa env foo:bar`
    Then the environment contains:
      """
      TOA_ENV=foo
      TOA_AMQP_CONTEXT={".":["amqp://foo.host"]}
      """

  Scenario: A missing overlay uses the fallback
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context:
          .: amqp://whatever
          .@bar: amqp://bar.host
      """
    When I run `toa env foo:bar`
    Then the environment contains:
      """
      TOA_ENV=foo
      TOA_AMQP_CONTEXT={".":["amqp://bar.host"]}
      """

  Scenario: A missing overlay and fallback use the unsuffixed key
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context: amqp://whatever
      """
    When I run `toa env foo:bar`
    Then the environment contains:
      """
      TOA_ENV=foo
      TOA_AMQP_CONTEXT={".":["amqp://whatever"]}
      """

  Scenario: A longer chain uses the first matching overlay
    Given I have a component `dummies.one`
    And I have a context with:
      """yaml
      amqp:
        context:
          .: amqp://whatever
          .@bar: amqp://bar.host
          .@baz: amqp://baz.host
      """
    When I run `toa env foo:bar:baz`
    Then the environment contains:
      """
      TOA_ENV=foo
      TOA_AMQP_CONTEXT={".":["amqp://bar.host"]}
      """

  Scenario: An environment name with an empty segment is refused
    Given I have a component `dummies.one`
    And I have a context
    When I run `toa env foo:`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Environment 'foo:' contains an empty name.
      """
