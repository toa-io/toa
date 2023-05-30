Feature: Container Building Options

  Scenario: Building a container with additional RUN
    Given I have a component `dummies.one`
    Given I have a context with:
    """
    registry:
      build:
        command: echo test
    """
    When I export images
    Then the file ./images/*dummies-one*/Dockerfile should contain exact line 'RUN echo test'
