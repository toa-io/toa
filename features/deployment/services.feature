@deployment
Feature: Extension service images

  An extension service's image is the extension on the runtime base and nothing else, so
  Toa's release publishes it. `registry.services` says whether an application takes that
  image or builds one of its own into `registry.base`.

  Background:
    Given I have a component `exposed.one`

  Scenario: Building the image, which is the default
    Given I have a context with:
      """yaml
      runtime:
        version: 1.2.3
      registry:
        base: example.com/reg
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export images
    Then the file ./images/extension-exposition-gateway.*/Dockerfile contains exact line 'CMD toa serve .'

  Scenario: Taking the published image
    Given I have a context with:
      """yaml
      runtime:
        version: 1.2.3
      registry:
        base: example.com/reg
        services: published
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export images
    Then there is no file ./images/extension-exposition-gateway.*/Dockerfile

  Scenario: The published image is tagged with the runtime version
    Given I have a context with:
      """yaml
      runtime:
        version: 1.2.3
      registry:
        base: example.com/reg
        services: published
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      services:
        - name: exposition-gateway
          image: ghcr.io/toa-io/extension-exposition-gateway:1.2.3
      """

  Scenario: A composition still runs the service it claims, published or not
    Given I have a context with:
      """yaml
      runtime:
        version: 1.2.3
      registry:
        base: example.com/reg
        services: published
      compositions:
        - name: edge
          components: [exposed.one]
          services: [exposition]
      configuration:
        identity.tokens:
          key0: secret.key
      """
    When I export images
    Then there is no file ./images/extension-exposition-gateway.*/Dockerfile
    And the file ./images/composition-edge.*/Dockerfile contains exact line 'CMD toa compose *'
