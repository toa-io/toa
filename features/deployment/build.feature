Feature: Container Building Options

  Scenario: Building a container with additional RUN
    Given I have a component `dummies.one`
    Given I have a context with:
    """
    registry:
      build:
        run: echo test
    """
    When I export images
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'RUN echo test'

  Scenario: Building a container with multiline RUN
    Given I have a component `dummies.one`
    Given I have a context with:
    """
    registry:
      build:
        run: |
          echo test > .test
          rm .test
    """
    When I export images
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'RUN echo test > .test'
    And the file ./images/*dummies-one*/Dockerfile contains exact line 'RUN rm .test'

  Scenario: Building a container with arguments
    Given I have a component `dummies.one`
    And I have a context with:
    """
    registry:
      build:
        arguments: [FOO, BAR]
    """
    When I export images
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'ARG FOO'
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'ENV FOO=$FOO'
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'ARG FOO'
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'ARG FOO'

  Scenario: Building an image with custom npm registry
    Given I have a component `dummies.one`
    And I have a context with:
    """
    runtime:
      registry: http://host.docker.internal:4873
    """
    When I export images
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'RUN if [ "http://host.docker.internal:4873" != "" ]; then npm set registry http://host.docker.internal:4873; fi'

  Scenario: Building an image with custom npm proxy
    Given I have a component `dummies.one`
    Given I have a context with:
    """
    runtime:
      proxy: http://host.docker.internal:4873
    """
    When I export images
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'RUN if [ "http://host.docker.internal:4873" != "" ]; then npm set proxy http://host.docker.internal:4873; fi'

  Scenario: Building an image with incorrect dependency in `package.json`
    Given I have a component `broken.dependency`
    And I have a context
    When I run `toa build`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      <...>ERR! 404  '@non-existent/dependency@1.0.0' is not in this registry.
      """

  Scenario: Building an image with default base image
    Given I have a component `dummies.one`
    Given I have a context
    When I export images
    Then the file ./images/*dummies-one*/Dockerfile contains exact line 'FROM node:20.9.0-alpine3.18'

  Scenario: Building an image with custom base image
    Given I have a component `dummies.debian`
    Given I have a context
    When I export images
    Then the file ./images/*dummies-debian*/Dockerfile contains exact line 'FROM node:20.10.0-buster-slim'

  Scenario: Getting error because of different base images
    Given I have components:
      | dummies.one    |
      | dummies.debian |
    Given I have a context with:
      """yaml
      compositions:
        - name: conflict
          components:
            - dummies.one
            - dummies.debian
      """
    When I run `toa build`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      <...>Error: Composition 'conflict' requires different base images for its components.
      """

  Scenario: Building a composition with different base images
    Given I have components:
      | dummies.one    |
      | dummies.debian |
    Given I have a context with:
      """yaml
      compositions:
        - name: conflict
          image: node:20.0.0-buster-slim
          components:
            - dummies.one
            - dummies.debian
      """
    When I export images
    Then the file ./images/*conflict*/Dockerfile contains exact line 'FROM node:20.0.0-buster-slim'
