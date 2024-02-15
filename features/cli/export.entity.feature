Feature: Print Entity

  Scenario: Show `export entity` help
    When I run `toa export entity --help`
    And stdout should contain lines:
      """
      toa export entity
      Print entity
        -p, --path
      """

  Scenario: Print entity from current directory
    Given I have a component `dummies.one`
    And my working directory is ./components/dummies.one
    When I run `toa export entity`
    And stdout should contain lines:
      """
      schema:
        properties:
          foo:
            type: integer
            default: 0
            definitions: {}
          bar:
            type: string
            definitions: {}
      """
