# The cluster these run against is whatever `kubectl` points at, which no compose file stands up,
# so they are `@manual`: point it at one and run them as their own set. What they write is in
# namespaces of their own.
#
#   $ TOA_FEATURES=manual npx cucumber-js features/deployment/secrets.feature
@manual @cli
Feature: Deploy refused where the cluster does not hold a secret

  Background:
    Given I have a component `dummies.one`
    And I have a context
    And the namespace `toa-features` holds no secrets

  Scenario: Not one secret is deployed
    When I run `toa deploy production -n toa-features`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Secrets are not deployed: toa-amqp-context.default/username, toa-amqp-context.default/password, toa-mongodb.default/username, toa-mongodb.default/password
      """
    And stdout should not contain lines:
      """
      toa> docker
      """

  Scenario: A secret is deployed without one of its keys
    When I run `toa conceal amqp-context.default username=todos password=secret -n toa-features`
    And I run `toa conceal mongodb.default username=todos -n toa-features`
    And I run `toa deploy production -n toa-features`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Secrets are not deployed: toa-mongodb.default/password
      """

  Scenario: The secrets are deployed
    Given the context has no `version` annotation
    When I run `toa conceal amqp-context.default username=todos password=secret -n toa-features`
    And I run `toa conceal mongodb.default username=todos password=secret -n toa-features`
    And I run `toa deploy production -n toa-features`
    Then program should exit with code 1
    And stderr should not contain lines:
      """
      Secrets are not deployed
      """
    And stderr should contain lines:
      """
      declares no version
      """

  Scenario: The secrets are deployed to another namespace
    Given the namespace `toa-features-elsewhere` holds no secrets
    When I run `toa conceal amqp-context.default username=todos password=secret -n toa-features-elsewhere`
    And I run `toa conceal mongodb.default username=todos password=secret -n toa-features-elsewhere`
    And I run `toa deploy production -n toa-features`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Secrets are not deployed: toa-amqp-context.default/username
      """

  Scenario: The image pull secret is not deployed
    Given I have a context with:
      """yaml
      registry:
        base: localhost:5000
        credentials: registry-credentials
      """
    When I run `toa conceal amqp-context.default username=todos password=secret -n toa-features`
    And I run `toa conceal mongodb.default username=todos password=secret -n toa-features`
    And I run `toa deploy production -n toa-features`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      Secrets are not deployed: registry-credentials
      """

  @helm
  Scenario: A dry run reads no cluster
    When I run `toa deploy production -n toa-features --dry`
    Then program should exit
    And stderr should not contain lines:
      """
      Secrets are not deployed
      """
