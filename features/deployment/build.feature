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
    Then the file ./images/*dummies-one*/Dockerfile should contain exact line 'RUN echo test'

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
    Then the file ./images/*dummies-one*/Dockerfile should contain exact line 'RUN echo test > .test'
    And the file ./images/*dummies-one*/Dockerfile should contain exact line 'RUN rm .test'
