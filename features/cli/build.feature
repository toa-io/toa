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

  Scenario: Replay samples inside a container
    Given I have components:
      | echo.beacon       |
      | math.calculations |
    And I have a context with:
    """
    compositions:
      - name: temp-0
        components:
          - echo.beacon
          - math.calculations
    """
    When I run `toa build`
    And I run `docker run --rm $(docker images -q localhost:5000/collection/composition-temp-0 | head -n 1) sh -c "toa replay *"`
    Then stdout should contain lines:
      """
      # Subtest: echo.beacon
      # Subtest: math.calculations
      <...>PASSED
      """
    Then I run `docker rmi $(docker images -q localhost:5000/collection/composition-temp-0)`
