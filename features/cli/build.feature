Feature: Build images

  Scenario: Build two components
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context
    When I run `toa build`
    When I run `docker image list`
    Then stdout should contain lines:
      """
      localhost:5000/collection/composition-dummies-two
      localhost:5000/collection/composition-dummies-one
      """
    Then I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-one)`
    Then I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-two)`

  Scenario Outline: Build composition (<command>)
    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
    """
    compositions:
      - name: onetwo
        components:
          - dummies.one
          - dummies.two
    """
    When I run `toa <command>`
    When I run `docker image list`
    Then stdout should contain lines:
      """
      localhost:5000/collection/composition-onetwo
      """
    Then I run `docker rmi $(docker images -q localhost:5000/collection/composition-onetwo)`
    Examples:
      | command |
      | build   |
      | push    |

  Scenario: Additional build command
    Given I have a component `dummies.one`
    And I have a context with:
    """
    registry:
      build:
        run: echo hello!
    """
    When I run `toa build`
    Then stderr should contain lines:
      """
      <...>RUN echo hello!
      """
    Then I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-one)`

  Scenario: Multiline build command
    Given I have a component `dummies.one`
    And I have a context with:
    """
    registry:
      build:
        run: |
          echo hi!
          echo bye!
    """
    When I run `toa build`
    Then program should exit with code 0
    And stderr should contain lines:
      """
      <...>RUN echo hi!
      <...>RUN echo bye!
      """
    Then I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-one)`

  Scenario: Building with arguments
    Given I have a component `dummies.one`
    And I have a context with:
    """
    registry:
      build:
        arguments: [TOA_DEV]
        run: echo toa_dev_is_${TOA_DEV} > value.txt
    """
    When I run `toa build`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      <...>--build-arg TOA_DEV=1
      """
    And I run `docker run --rm $(docker images -q localhost:5000/collection/composition-dummies-one | head -n 1) sh -c "cat value.txt"`
    Then stdout should contain lines:
      """
      toa_dev_is_1
      """
    Then I run `docker rmi $(docker images -q localhost:5000/collection/composition-dummies-one)`
